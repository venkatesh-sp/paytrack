import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  lendingContact,
  lendingTransaction,
  monthlyPayable,
  trackingItem,
  type LendingTransaction,
  type MonthlyPayable,
} from "@/db/schema";
import type {
  LendingExportFile,
  TrackingItemsExportFile,
} from "@/lib/validations/data-transfer";

function toIso(date: Date): string {
  return date.toISOString();
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const list = map.get(key(item));
    if (list) list.push(item);
    else map.set(key(item), [item]);
  }
  return map;
}

export async function exportTrackingItemsData(
  userId: string,
): Promise<TrackingItemsExportFile> {
  const items = await db
    .select()
    .from(trackingItem)
    .where(eq(trackingItem.userId, userId));

  const payables = await db
    .select()
    .from(monthlyPayable)
    .where(
      and(eq(monthlyPayable.userId, userId), isNotNull(monthlyPayable.trackingItemId)),
    );

  const payablesByItem = groupBy(payables, (p) => p.trackingItemId as string);

  const toPayableExport = (p: MonthlyPayable) => ({
    category: p.category,
    title: p.title,
    amount: p.amount,
    dueDate: p.dueDate,
    billingPeriod: p.billingPeriod,
    status: p.status,
    paidAmount: p.paidAmount,
    paidAt: p.paidAt ? toIso(p.paidAt) : null,
    notes: p.notes,
    createdAt: toIso(p.createdAt),
  });

  return {
    kind: "paytrack.tracking-items",
    version: 1,
    exportedAt: toIso(new Date()),
    trackingItems: items.map((item) => ({
      name: item.name,
      type: item.type,
      status: item.status,
      lenderName: item.lenderName,
      accountNumberLast4: item.accountNumberLast4,
      principalAmount: item.principalAmount,
      interestRate: item.interestRate,
      monthlyEmiAmount: item.monthlyEmiAmount,
      outstandingAmount: item.outstandingAmount,
      tenureMonths: item.tenureMonths,
      emiDay: item.emiDay,
      startDate: item.startDate,
      endDate: item.endDate,
      notes: item.notes,
      createdAt: toIso(item.createdAt),
      monthlyPayables: (payablesByItem.get(item.id) ?? []).map(toPayableExport),
    })),
  };
}

export async function importTrackingItemsData(
  userId: string,
  file: TrackingItemsExportFile,
): Promise<{ itemsImported: number; payablesImported: number }> {
  let itemsImported = 0;
  let payablesImported = 0;

  await db.transaction(async (tx) => {
    for (const item of file.trackingItems) {
      const [created] = await tx
        .insert(trackingItem)
        .values({
          userId,
          name: item.name,
          type: item.type,
          status: item.status,
          lenderName: item.lenderName,
          accountNumberLast4: item.accountNumberLast4,
          principalAmount: item.principalAmount,
          interestRate: item.interestRate,
          monthlyEmiAmount: item.monthlyEmiAmount,
          outstandingAmount: item.outstandingAmount,
          tenureMonths: item.tenureMonths,
          emiDay: item.emiDay,
          startDate: item.startDate,
          endDate: item.endDate,
          notes: item.notes,
          createdAt: new Date(item.createdAt),
        })
        .returning({ id: trackingItem.id });
      itemsImported++;

      if (item.monthlyPayables.length > 0) {
        await tx.insert(monthlyPayable).values(
          item.monthlyPayables.map((p) => ({
            userId,
            trackingItemId: created.id,
            source: "tracking_item" as const,
            category: p.category,
            title: p.title,
            amount: p.amount,
            dueDate: p.dueDate,
            billingPeriod: p.billingPeriod,
            status: p.status,
            paidAmount: p.paidAmount,
            paidAt: p.paidAt ? new Date(p.paidAt) : null,
            notes: p.notes,
            createdAt: new Date(p.createdAt),
          })),
        );
        payablesImported += item.monthlyPayables.length;
      }
    }
  });

  return { itemsImported, payablesImported };
}

export async function exportLendingData(userId: string): Promise<LendingExportFile> {
  const contacts = await db
    .select()
    .from(lendingContact)
    .where(eq(lendingContact.userId, userId));

  const transactions = await db
    .select()
    .from(lendingTransaction)
    .where(eq(lendingTransaction.userId, userId));

  const transactionsByContact = groupBy(transactions, (t) => t.contactId);

  return {
    kind: "paytrack.lending",
    version: 1,
    exportedAt: toIso(new Date()),
    contacts: contacts.map((contact) => ({
      name: contact.name,
      phone: contact.phone,
      notes: contact.notes,
      createdAt: toIso(contact.createdAt),
      transactions: (transactionsByContact.get(contact.id) ?? []).map((t) => ({
        type: t.type,
        amount: t.amount,
        transactionDate: t.transactionDate,
        note: t.note,
        createdAt: toIso(t.createdAt),
      })),
    })),
  };
}

// Balance is a cached running total (see lending.ts) — recomputed from the
// imported transactions rather than trusting a `balance` field, since
// nothing in this file's shape carries one (see exportLendingData: it's
// intentionally not round-tripped, only derived state).
function computeBalance(
  transactions: Pick<LendingTransaction, "type" | "amount">[],
): string {
  const total = transactions.reduce(
    (sum, t) => sum + (t.type === "you_gave" ? Number(t.amount) : -Number(t.amount)),
    0,
  );
  return total.toFixed(2);
}

export async function importLendingData(
  userId: string,
  file: LendingExportFile,
): Promise<{ contactsImported: number; transactionsImported: number }> {
  let contactsImported = 0;
  let transactionsImported = 0;

  await db.transaction(async (tx) => {
    for (const contact of file.contacts) {
      const [created] = await tx
        .insert(lendingContact)
        .values({
          userId,
          name: contact.name,
          phone: contact.phone,
          notes: contact.notes,
          balance: computeBalance(contact.transactions),
          createdAt: new Date(contact.createdAt),
        })
        .returning({ id: lendingContact.id });
      contactsImported++;

      if (contact.transactions.length > 0) {
        await tx.insert(lendingTransaction).values(
          contact.transactions.map((t) => ({
            userId,
            contactId: created.id,
            type: t.type,
            amount: t.amount,
            transactionDate: t.transactionDate,
            note: t.note,
            createdAt: new Date(t.createdAt),
          })),
        );
        transactionsImported += contact.transactions.length;
      }
    }
  });

  return { contactsImported, transactionsImported };
}
