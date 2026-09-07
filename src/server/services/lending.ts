import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  lendingContact,
  lendingTransaction,
  type LendingContact,
  type LendingTransaction,
} from "@/db/schema";
import { NotFoundError, ValidationError } from "@/server/errors";
import type {
  AddLendingTransactionInput,
  CreateLendingContactInput,
  UpdateLendingContactInput,
} from "@/lib/validations/lending";

function normalizeOptional(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function listLendingContacts(userId: string): Promise<LendingContact[]> {
  return db
    .select()
    .from(lendingContact)
    .where(eq(lendingContact.userId, userId))
    .orderBy(desc(lendingContact.updatedAt));
}

export async function getLendingContactById(
  userId: string,
  id: string,
): Promise<LendingContact> {
  const [contact] = await db
    .select()
    .from(lendingContact)
    .where(and(eq(lendingContact.id, id), eq(lendingContact.userId, userId)));

  if (!contact) throw new NotFoundError("Contact");
  return contact;
}

export async function listLendingTransactions(
  userId: string,
  contactId: string,
): Promise<LendingTransaction[]> {
  return db
    .select()
    .from(lendingTransaction)
    .where(
      and(
        eq(lendingTransaction.contactId, contactId),
        eq(lendingTransaction.userId, userId),
      ),
    )
    .orderBy(
      desc(lendingTransaction.transactionDate),
      desc(lendingTransaction.createdAt),
    );
}

export async function createLendingContact(
  userId: string,
  input: CreateLendingContactInput,
): Promise<LendingContact> {
  const [created] = await db
    .insert(lendingContact)
    .values({
      userId,
      name: input.name,
      phone: normalizeOptional(input.phone),
      notes: normalizeOptional(input.notes),
    })
    .returning();

  return created;
}

export async function updateLendingContact(
  userId: string,
  id: string,
  input: UpdateLendingContactInput,
): Promise<LendingContact> {
  await getLendingContactById(userId, id); // ownership + existence check

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.phone !== undefined) updates.phone = normalizeOptional(input.phone);
  if (input.notes !== undefined) updates.notes = normalizeOptional(input.notes);

  const [updated] = await db
    .update(lendingContact)
    .set(updates)
    .where(and(eq(lendingContact.id, id), eq(lendingContact.userId, userId)))
    .returning();

  if (!updated) throw new NotFoundError("Contact");
  return updated;
}

export async function deleteLendingContact(userId: string, id: string): Promise<void> {
  const result = await db
    .delete(lendingContact)
    .where(and(eq(lendingContact.id, id), eq(lendingContact.userId, userId)))
    .returning({ id: lendingContact.id });

  if (result.length === 0) throw new NotFoundError("Contact");
}

function balanceDelta(type: AddLendingTransactionInput["type"], amount: number): number {
  return type === "you_gave" ? amount : -amount;
}

export async function addLendingTransaction(
  userId: string,
  contactId: string,
  input: AddLendingTransactionInput,
): Promise<{ transaction: LendingTransaction; contact: LendingContact }> {
  return db.transaction(async (tx) => {
    const [contact] = await tx
      .select()
      .from(lendingContact)
      .where(and(eq(lendingContact.id, contactId), eq(lendingContact.userId, userId)))
      .for("update");

    if (!contact) throw new NotFoundError("Contact");

    const amount = Number(input.amount);
    const newBalance = (
      Number(contact.balance) + balanceDelta(input.type, amount)
    ).toFixed(2);

    const [updatedContact] = await tx
      .update(lendingContact)
      .set({ balance: newBalance })
      .where(eq(lendingContact.id, contactId))
      .returning();

    const [transaction] = await tx
      .insert(lendingTransaction)
      .values({
        userId,
        contactId,
        type: input.type,
        amount: input.amount,
        transactionDate: input.transactionDate,
        note: normalizeOptional(input.note),
      })
      .returning();

    return { transaction, contact: updatedContact };
  });
}

export async function deleteLendingTransaction(
  userId: string,
  contactId: string,
  transactionId: string,
): Promise<LendingContact> {
  return db.transaction(async (tx) => {
    const [contact] = await tx
      .select()
      .from(lendingContact)
      .where(and(eq(lendingContact.id, contactId), eq(lendingContact.userId, userId)))
      .for("update");

    if (!contact) throw new NotFoundError("Contact");

    const [transaction] = await tx
      .select()
      .from(lendingTransaction)
      .where(
        and(
          eq(lendingTransaction.id, transactionId),
          eq(lendingTransaction.contactId, contactId),
          eq(lendingTransaction.userId, userId),
        ),
      );

    if (!transaction) throw new NotFoundError("Transaction");

    const reversedBalance = (
      Number(contact.balance) - balanceDelta(transaction.type, Number(transaction.amount))
    ).toFixed(2);

    const [updatedContact] = await tx
      .update(lendingContact)
      .set({ balance: reversedBalance })
      .where(eq(lendingContact.id, contactId))
      .returning();

    const deleted = await tx
      .delete(lendingTransaction)
      .where(eq(lendingTransaction.id, transactionId))
      .returning({ id: lendingTransaction.id });

    if (deleted.length === 0) throw new ValidationError("Transaction already deleted");

    return updatedContact;
  });
}

export type LendingSummary = {
  totalOwedToYou: number;
  totalYouOwe: number;
  owedTrend: number;
  oweTrend: number;
};

export async function getLendingSummary(userId: string): Promise<LendingSummary> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const contacts = await db
    .select({ id: lendingContact.id, balance: lendingContact.balance })
    .from(lendingContact)
    .where(eq(lendingContact.userId, userId));

  const recentDeltas = await db
    .select({
      contactId: lendingTransaction.contactId,
      delta: sql<string>`sum(case when ${lendingTransaction.type} = 'you_gave' then ${lendingTransaction.amount} else -${lendingTransaction.amount} end)`,
    })
    .from(lendingTransaction)
    .where(
      and(
        eq(lendingTransaction.userId, userId),
        gte(lendingTransaction.transactionDate, cutoff),
      ),
    )
    .groupBy(lendingTransaction.contactId);

  const deltaByContact = new Map(
    recentDeltas.map((row) => [row.contactId, Number(row.delta)]),
  );

  let totalOwedToYou = 0;
  let totalYouOwe = 0;
  let totalOwedToYou30dAgo = 0;
  let totalYouOwe30dAgo = 0;

  for (const contact of contacts) {
    const balance = Number(contact.balance);
    const balance30dAgo = balance - (deltaByContact.get(contact.id) ?? 0);

    totalOwedToYou += Math.max(balance, 0);
    totalYouOwe += Math.max(-balance, 0);
    totalOwedToYou30dAgo += Math.max(balance30dAgo, 0);
    totalYouOwe30dAgo += Math.max(-balance30dAgo, 0);
  }

  return {
    totalOwedToYou,
    totalYouOwe,
    owedTrend: totalOwedToYou - totalOwedToYou30dAgo,
    oweTrend: totalYouOwe - totalYouOwe30dAgo,
  };
}
