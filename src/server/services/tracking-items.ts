import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { monthlyPayable, trackingItem, type TrackingItem } from "@/db/schema";
import { computeEndDate, listBillingPeriods, todayDateString } from "@/lib/dates";
import { NotFoundError } from "@/server/errors";
import type {
  CreateTrackingItemInput,
  UpdateTrackingItemInput,
} from "@/lib/validations/tracking-item";

function normalizeOptional(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export type TrackingItemWithEmiCounts = TrackingItem & {
  paidEmiCount: number;
  pendingEmiCount: number;
};

async function getEmiCountsByItem(
  userId: string,
  trackingItemIds?: string[],
): Promise<Map<string, { paid: number; pending: number }>> {
  const conditions = [
    eq(monthlyPayable.userId, userId),
    isNotNull(monthlyPayable.trackingItemId),
  ];

  const rows = await db
    .select({
      trackingItemId: monthlyPayable.trackingItemId,
      status: monthlyPayable.status,
      count: count(),
    })
    .from(monthlyPayable)
    .where(and(...conditions))
    .groupBy(monthlyPayable.trackingItemId, monthlyPayable.status);

  const counts = new Map<string, { paid: number; pending: number }>();
  for (const row of rows) {
    if (!row.trackingItemId) continue;
    if (trackingItemIds && !trackingItemIds.includes(row.trackingItemId)) continue;

    const entry = counts.get(row.trackingItemId) ?? { paid: 0, pending: 0 };
    if (row.status === "paid") entry.paid += row.count;
    else entry.pending += row.count;
    counts.set(row.trackingItemId, entry);
  }

  return counts;
}

export async function listTrackingItems(
  userId: string,
  filters: { status?: string; type?: string } = {},
): Promise<TrackingItemWithEmiCounts[]> {
  const conditions = [eq(trackingItem.userId, userId)];
  if (filters.status) {
    conditions.push(eq(trackingItem.status, filters.status as TrackingItem["status"]));
  }
  if (filters.type) {
    conditions.push(eq(trackingItem.type, filters.type as TrackingItem["type"]));
  }

  const items = await db
    .select()
    .from(trackingItem)
    .where(and(...conditions))
    .orderBy(desc(trackingItem.createdAt));

  const counts = await getEmiCountsByItem(
    userId,
    items.map((item) => item.id),
  );

  return items.map((item) => ({
    ...item,
    paidEmiCount: counts.get(item.id)?.paid ?? 0,
    pendingEmiCount: counts.get(item.id)?.pending ?? 0,
  }));
}

export async function getTrackingItemById(
  userId: string,
  id: string,
): Promise<TrackingItemWithEmiCounts> {
  const [item] = await db
    .select()
    .from(trackingItem)
    .where(and(eq(trackingItem.id, id), eq(trackingItem.userId, userId)));

  if (!item) throw new NotFoundError("Tracking item");

  const counts = await getEmiCountsByItem(userId, [id]);

  return {
    ...item,
    paidEmiCount: counts.get(id)?.paid ?? 0,
    pendingEmiCount: counts.get(id)?.pending ?? 0,
  };
}

type TxOrDb = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Deletes any `monthlyPayable` row for this tracking item whose billing
 * period falls outside its current start-to-end schedule. Called after a
 * start date, tenure, or EMI-day edit narrows or shifts that schedule — e.g.
 * moving the start date from 2024-04-04 to 2024-05-04 drops the 2024-04
 * period entirely, so the payable generated for it is no longer a valid
 * record and must go with it (its payment_history/reminder_log rows cascade
 * along, same as a deleted tracking item).
 */
async function pruneInvalidPayables(
  tx: TxOrDb,
  item: Pick<TrackingItem, "id" | "startDate" | "endDate" | "emiDay">,
): Promise<void> {
  const validPeriods = new Set(
    listBillingPeriods(item.startDate, item.endDate, item.emiDay).map(
      (period) => period.billingPeriod,
    ),
  );

  const existingPayables = await tx
    .select({ id: monthlyPayable.id, billingPeriod: monthlyPayable.billingPeriod })
    .from(monthlyPayable)
    .where(eq(monthlyPayable.trackingItemId, item.id));

  const staleIds = existingPayables
    .filter((payable) => !validPeriods.has(payable.billingPeriod))
    .map((payable) => payable.id);

  if (staleIds.length > 0) {
    await tx.delete(monthlyPayable).where(inArray(monthlyPayable.id, staleIds));
  }
}

/**
 * Ensures every billing period across a tracking item's FULL schedule (start
 * date through end date — not just elapsed months) has a `monthlyPayable`
 * row, and reconciles elapsed periods against the caller's desired paid
 * selection (the create/edit form's EMI checklist, which only ever offers
 * elapsed months and is meant to be revisited any number of times, toggled
 * either way, as often as needed).
 *
 * Status rule for a period that doesn't have a row yet:
 *  - due date in the past and selected -> paid
 *  - due date in the past and not selected -> overdue
 *  - due date today or in the future -> pending
 *
 * An elapsed period that already has a row is updated to match the desired
 * selection when it disagrees. A future period that already has a row (e.g.
 * generated early via the Payables "Generate this month" action) is left
 * untouched — this only fills schedule gaps and reconciles the elapsed set.
 *
 * This only ever touches `monthlyPayable` status — it deliberately does not
 * write to `payment_history`, which is reserved for payments actually
 * recorded through the Payables "mark paid" flow. The checklist is a
 * bookkeeping/backfill tool for the item's own paid/pending state, not a
 * source of payment-history ledger entries.
 *
 * Called on create (where every period is necessarily missing, so this
 * generates the entire schedule), and on update in two modes:
 *  - `touchExisting: true` (an explicit checklist was sent) also reconciles
 *    already-tracked elapsed periods against it, exactly as before.
 *  - `touchExisting: false` (schedule range changed but no checklist was
 *    sent) only fills gaps left by the new range — e.g. moving the start
 *    date earlier makes newly-in-range months reappear as pending/overdue —
 *    without ever touching an existing row's paid status. This is what
 *    keeps a start-date/tenure-only edit from silently reversing real
 *    payment records it wasn't asked to touch.
 */
async function reconcilePayables(
  tx: TxOrDb,
  userId: string,
  item: Pick<
    TrackingItem,
    "id" | "name" | "monthlyEmiAmount" | "startDate" | "endDate" | "emiDay"
  >,
  desiredPaidPeriods: string[],
  options: { touchExisting: boolean } = { touchExisting: true },
): Promise<void> {
  const periods = listBillingPeriods(item.startDate, item.endDate, item.emiDay);
  if (periods.length === 0) return;

  const today = todayDateString();
  const desiredSet = new Set(desiredPaidPeriods);

  const existingPayables = await tx
    .select()
    .from(monthlyPayable)
    .where(eq(monthlyPayable.trackingItemId, item.id));
  const payableByPeriod = new Map(existingPayables.map((p) => [p.billingPeriod, p]));

  for (const period of periods) {
    const isElapsed = period.dueDate < today;
    const payable = payableByPeriod.get(period.billingPeriod);

    if (!payable) {
      const wantsPaid = isElapsed && desiredSet.has(period.billingPeriod);
      await tx.insert(monthlyPayable).values({
        userId,
        trackingItemId: item.id,
        source: "tracking_item",
        category: "emi",
        title: `${item.name} EMI`,
        amount: item.monthlyEmiAmount,
        dueDate: period.dueDate,
        billingPeriod: period.billingPeriod,
        status: wantsPaid ? "paid" : isElapsed ? "overdue" : "pending",
        paidAmount: wantsPaid ? item.monthlyEmiAmount : "0",
        paidAt: wantsPaid ? new Date(period.dueDate) : null,
      });
      continue;
    }

    if (!options.touchExisting) continue;
    if (!isElapsed) continue; // never reconcile a future period that already exists

    const currentlyPaid = payable.status === "paid";
    const wantsPaid = desiredSet.has(period.billingPeriod);
    if (wantsPaid === currentlyPaid) continue; // already matches — no-op

    if (wantsPaid) {
      await tx
        .update(monthlyPayable)
        .set({
          status: "paid",
          paidAmount: item.monthlyEmiAmount,
          paidAt: new Date(period.dueDate),
        })
        .where(eq(monthlyPayable.id, payable.id));
    } else {
      await tx
        .update(monthlyPayable)
        .set({ status: "overdue", paidAmount: "0", paidAt: null })
        .where(eq(monthlyPayable.id, payable.id));
    }
  }
}

export async function createTrackingItem(
  userId: string,
  input: CreateTrackingItemInput,
): Promise<TrackingItem> {
  const tenureMonths = Number(input.tenureMonths);
  const emiDay = Number(input.emiDay);
  const endDate = computeEndDate(input.startDate, tenureMonths);
  // Total scheduled repayment (EMI × tenure) — not the principal, which
  // undercounts whenever interest is involved — is what outstanding is
  // measured against.
  const totalRepayment = Number(input.monthlyEmiAmount) * tenureMonths;

  const outstandingAmount = Math.min(
    totalRepayment,
    Math.max(0, Number(input.outstandingAmount ?? totalRepayment)),
  ).toFixed(2);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(trackingItem)
      .values({
        userId,
        name: input.name,
        type: input.type,
        lenderName: normalizeOptional(input.lenderName),
        accountNumberLast4: normalizeOptional(input.accountNumberLast4),
        principalAmount: input.principalAmount,
        interestRate: normalizeOptional(input.interestRate),
        monthlyEmiAmount: input.monthlyEmiAmount,
        outstandingAmount,
        tenureMonths,
        emiDay,
        startDate: input.startDate,
        endDate,
        notes: normalizeOptional(input.notes),
      })
      .returning();

    await reconcilePayables(tx, userId, created, input.paidBillingPeriods ?? []);

    return created;
  });
}

export async function updateTrackingItem(
  userId: string,
  id: string,
  input: UpdateTrackingItemInput,
): Promise<TrackingItem> {
  await getTrackingItemById(userId, id); // ownership + existence check

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.type !== undefined) updates.type = input.type;
  if (input.lenderName !== undefined)
    updates.lenderName = normalizeOptional(input.lenderName);
  if (input.accountNumberLast4 !== undefined)
    updates.accountNumberLast4 = normalizeOptional(input.accountNumberLast4);
  if (input.principalAmount !== undefined)
    updates.principalAmount = input.principalAmount;
  if (input.interestRate !== undefined)
    updates.interestRate = normalizeOptional(input.interestRate);
  if (input.monthlyEmiAmount !== undefined)
    updates.monthlyEmiAmount = input.monthlyEmiAmount;
  if (input.outstandingAmount !== undefined)
    updates.outstandingAmount = input.outstandingAmount;
  if (input.tenureMonths !== undefined) updates.tenureMonths = Number(input.tenureMonths);
  if (input.emiDay !== undefined) updates.emiDay = Number(input.emiDay);
  if (input.notes !== undefined) updates.notes = normalizeOptional(input.notes);
  if (input.status !== undefined) updates.status = input.status;

  // The billing-period schedule is a function of BOTH fields together — the
  // start date pins where it begins, the tenure pins how far it runs — so
  // either one changing alone shifts or resizes it. Recompute endDate (and
  // re-set startDate even when only tenure changed) so the pruning/backfill
  // step below, gated on `scheduleChanged`, always sees the up-to-date range
  // and never keys off start date alone.
  const scheduleChanged =
    input.startDate !== undefined || input.tenureMonths !== undefined;
  if (scheduleChanged) {
    const current = await getTrackingItemById(userId, id);
    const startDate = input.startDate ?? current.startDate;
    const tenureMonths =
      input.tenureMonths !== undefined
        ? Number(input.tenureMonths)
        : current.tenureMonths;
    updates.startDate = startDate;
    updates.endDate = computeEndDate(startDate, tenureMonths);
  }

  return db.transaction(async (tx) => {
    // A caller may send only `paidBillingPeriods` (e.g. just reconciling the
    // EMI checklist) with no tracking-item field actually changing — an
    // empty `.set()` is rejected by Drizzle, so skip straight to a plain
    // read in that case.
    const [updated] =
      Object.keys(updates).length > 0
        ? await tx
            .update(trackingItem)
            .set(updates)
            .where(and(eq(trackingItem.id, id), eq(trackingItem.userId, userId)))
            .returning()
        : await tx
            .select()
            .from(trackingItem)
            .where(and(eq(trackingItem.id, id), eq(trackingItem.userId, userId)));

    if (!updated) throw new NotFoundError("Tracking item");

    // The start date and/or tenure changed, which narrows or shifts the
    // valid schedule — drop any payable whose billing period fell outside
    // it (e.g. a period before the new, later start date, or past a
    // shortened tenure's new end date), then backfill any newly-in-range
    // period that doesn't have a row yet (e.g. moving the start date
    // earlier, or extending the tenure). Only reconcile already-tracked
    // elapsed periods against the checklist when one was explicitly sent —
    // an update that isn't about EMI history at all (e.g. a direct API call
    // that omits the field) must never be read as "nothing is paid" and
    // start reversing real payment records.
    if (scheduleChanged) {
      await pruneInvalidPayables(tx, updated);
      await reconcilePayables(tx, userId, updated, input.paidBillingPeriods ?? [], {
        touchExisting: input.paidBillingPeriods !== undefined,
      });
    } else if (input.paidBillingPeriods !== undefined) {
      await reconcilePayables(tx, userId, updated, input.paidBillingPeriods);
    }

    return updated;
  });
}

export async function deleteTrackingItem(userId: string, id: string): Promise<void> {
  const result = await db
    .delete(trackingItem)
    .where(and(eq(trackingItem.id, id), eq(trackingItem.userId, userId)))
    .returning({ id: trackingItem.id });

  if (result.length === 0) throw new NotFoundError("Tracking item");
}
