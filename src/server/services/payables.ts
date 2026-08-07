import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { monthlyPayable, trackingItem, type MonthlyPayable } from "@/db/schema";
import {
  currentBillingPeriod,
  dueDateFor,
  parseBillingPeriod,
} from "@/lib/dates";
import { NotFoundError, ValidationError } from "@/server/errors";
import type {
  CreateManualPayableInput,
  UpdatePayableInput,
} from "@/lib/validations/payable";

function normalizeOptional(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function generateMonthlyPayables(
  userId: string,
  month?: string,
): Promise<{ created: number; skipped: number; period: string }> {
  const period = month ?? currentBillingPeriod();
  const { year, monthIndex0 } = parseBillingPeriod(period);

  const items = await db
    .select()
    .from(trackingItem)
    .where(and(eq(trackingItem.userId, userId), eq(trackingItem.status, "active")));

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const dueDate = dueDateFor(year, monthIndex0, item.emiDay);

    if (dueDate < item.startDate || dueDate > item.endDate) {
      skipped++;
      continue;
    }

    const inserted = await db
      .insert(monthlyPayable)
      .values({
        userId,
        trackingItemId: item.id,
        source: "tracking_item",
        category: "emi",
        title: `${item.name} EMI`,
        amount: item.monthlyEmiAmount,
        dueDate,
        billingPeriod: period,
        status: "pending",
      })
      .onConflictDoNothing({
        target: [monthlyPayable.trackingItemId, monthlyPayable.billingPeriod],
        where: isNotNull(monthlyPayable.trackingItemId),
      })
      .returning({ id: monthlyPayable.id });

    if (inserted.length > 0) created++;
    else skipped++;
  }

  return { created, skipped, period };
}

export async function createManualPayable(
  userId: string,
  input: CreateManualPayableInput,
): Promise<MonthlyPayable> {
  const [created] = await db
    .insert(monthlyPayable)
    .values({
      userId,
      trackingItemId: null,
      source: "manual",
      category: input.category,
      title: input.title,
      amount: input.amount,
      dueDate: input.dueDate,
      billingPeriod: input.dueDate.slice(0, 7),
      status: "pending",
      notes: normalizeOptional(input.notes),
    })
    .returning();

  return created;
}

export async function listPayables(
  userId: string,
  filters: { status?: string; billingPeriod?: string; category?: string } = {},
): Promise<MonthlyPayable[]> {
  const conditions = [eq(monthlyPayable.userId, userId)];
  if (filters.status) {
    conditions.push(eq(monthlyPayable.status, filters.status as MonthlyPayable["status"]));
  }
  if (filters.billingPeriod) {
    conditions.push(eq(monthlyPayable.billingPeriod, filters.billingPeriod));
  }
  if (filters.category) {
    conditions.push(eq(monthlyPayable.category, filters.category as MonthlyPayable["category"]));
  }

  return db
    .select()
    .from(monthlyPayable)
    .where(and(...conditions))
    .orderBy(desc(monthlyPayable.dueDate));
}

export async function getPayableById(userId: string, id: string): Promise<MonthlyPayable> {
  const [payable] = await db
    .select()
    .from(monthlyPayable)
    .where(and(eq(monthlyPayable.id, id), eq(monthlyPayable.userId, userId)));

  if (!payable) throw new NotFoundError("Payable");
  return payable;
}

export async function updatePayable(
  userId: string,
  id: string,
  input: UpdatePayableInput,
): Promise<MonthlyPayable> {
  const current = await getPayableById(userId, id);

  if (current.source === "tracking_item" && (input.amount || input.category || input.title)) {
    throw new ValidationError(
      "Amount, title, and category are derived from the tracking item and can't be edited directly",
    );
  }

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.category !== undefined) updates.category = input.category;
  if (input.notes !== undefined) updates.notes = normalizeOptional(input.notes);
  if (input.dueDate !== undefined) {
    updates.dueDate = input.dueDate;
    updates.billingPeriod = input.dueDate.slice(0, 7);
  }

  const [updated] = await db
    .update(monthlyPayable)
    .set(updates)
    .where(and(eq(monthlyPayable.id, id), eq(monthlyPayable.userId, userId)))
    .returning();

  if (!updated) throw new NotFoundError("Payable");
  return updated;
}

export async function deletePayable(userId: string, id: string): Promise<void> {
  const current = await getPayableById(userId, id);

  if (Number(current.paidAmount) > 0) {
    throw new ValidationError("Can't delete a payable that already has payments recorded");
  }

  await db
    .delete(monthlyPayable)
    .where(and(eq(monthlyPayable.id, id), eq(monthlyPayable.userId, userId)));
}
