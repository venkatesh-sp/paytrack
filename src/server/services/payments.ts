import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  monthlyPayable,
  paymentHistory,
  trackingItem,
  type MonthlyPayable,
  type PaymentHistory,
  type TrackingItem,
} from "@/db/schema";
import { NotFoundError, ValidationError } from "@/server/errors";
import type { RecordPaymentInput } from "@/lib/validations/payment";

function normalizeOptional(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function recordPayment(
  userId: string,
  payableId: string,
  input: RecordPaymentInput,
): Promise<{
  payment: PaymentHistory;
  payable: MonthlyPayable;
  trackingItem: TrackingItem | null;
}> {
  return db.transaction(async (tx) => {
    const [payable] = await tx
      .select()
      .from(monthlyPayable)
      .where(and(eq(monthlyPayable.id, payableId), eq(monthlyPayable.userId, userId)))
      .for("update");

    if (!payable) throw new NotFoundError("Payable");
    if (payable.status === "paid") {
      throw new ValidationError("This payable has already been fully paid");
    }

    const remaining = Number(payable.amount) - Number(payable.paidAmount);
    const amount = input.amount ? Number(input.amount) : remaining;

    if (amount <= 0) {
      throw new ValidationError("Payment amount must be greater than 0");
    }
    if (amount > remaining + 0.01) {
      throw new ValidationError(
        `Payment amount exceeds the remaining balance of ${remaining.toFixed(2)}`,
      );
    }

    let updatedTrackingItem: TrackingItem | null = null;
    let outstandingAfter: string | null = null;

    if (payable.trackingItemId) {
      const [item] = await tx
        .select()
        .from(trackingItem)
        .where(
          and(eq(trackingItem.id, payable.trackingItemId), eq(trackingItem.userId, userId)),
        )
        .for("update");

      if (item) {
        const newOutstanding = Math.max(0, Number(item.outstandingAmount) - amount);
        outstandingAfter = newOutstanding.toFixed(2);

        const [updated] = await tx
          .update(trackingItem)
          .set({
            outstandingAmount: outstandingAfter,
            status: newOutstanding <= 0 ? "completed" : item.status,
          })
          .where(eq(trackingItem.id, item.id))
          .returning();

        updatedTrackingItem = updated;
      }
    }

    const [payment] = await tx
      .insert(paymentHistory)
      .values({
        userId,
        monthlyPayableId: payable.id,
        trackingItemId: payable.trackingItemId,
        amount: amount.toFixed(2),
        outstandingAfter,
        paymentDate: input.paymentDate,
        paymentMethod: normalizeOptional(input.paymentMethod),
        notes: normalizeOptional(input.notes),
      })
      .returning();

    const newPaidAmount = Number(payable.paidAmount) + amount;
    const newStatus = newPaidAmount >= Number(payable.amount) ? "paid" : payable.status;

    const [updatedPayable] = await tx
      .update(monthlyPayable)
      .set({
        paidAmount: newPaidAmount.toFixed(2),
        status: newStatus,
        paidAt: newStatus === "paid" ? new Date() : payable.paidAt,
      })
      .where(eq(monthlyPayable.id, payable.id))
      .returning();

    return { payment, payable: updatedPayable, trackingItem: updatedTrackingItem };
  });
}

export type PaymentHistoryEntry = PaymentHistory & {
  payableTitle: string;
  payableCategory: MonthlyPayable["category"];
};

export async function listPaymentHistory(
  userId: string,
  filters: { trackingItemId?: string; year?: number; month?: string; type?: string } = {},
): Promise<PaymentHistoryEntry[]> {
  const conditions = [eq(paymentHistory.userId, userId)];
  if (filters.trackingItemId) {
    conditions.push(eq(paymentHistory.trackingItemId, filters.trackingItemId));
  }
  if (filters.month) {
    const [year, month] = filters.month.split("-").map(Number);
    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end = new Date(year, month, 1).toISOString().slice(0, 10);
    conditions.push(gte(paymentHistory.paymentDate, start), lt(paymentHistory.paymentDate, end));
  } else if (filters.year) {
    conditions.push(
      gte(paymentHistory.paymentDate, `${filters.year}-01-01`),
      lt(paymentHistory.paymentDate, `${filters.year + 1}-01-01`),
    );
  }
  if (filters.type) {
    conditions.push(eq(trackingItem.type, filters.type as TrackingItem["type"]));
  }

  const rows = await db
    .select({
      payment: paymentHistory,
      payableTitle: monthlyPayable.title,
      payableCategory: monthlyPayable.category,
    })
    .from(paymentHistory)
    .innerJoin(monthlyPayable, eq(paymentHistory.monthlyPayableId, monthlyPayable.id))
    .leftJoin(trackingItem, eq(paymentHistory.trackingItemId, trackingItem.id))
    .where(and(...conditions))
    .orderBy(desc(paymentHistory.paymentDate), desc(paymentHistory.recordedAt));

  return rows.map((row) => ({
    ...row.payment,
    payableTitle: row.payableTitle,
    payableCategory: row.payableCategory,
  }));
}
