import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trackingItem, type TrackingItem } from "@/db/schema";
import { computeEndDate } from "@/lib/dates";
import { NotFoundError } from "@/server/errors";
import type {
  CreateTrackingItemInput,
  UpdateTrackingItemInput,
} from "@/lib/validations/tracking-item";

function normalizeOptional(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function listTrackingItems(
  userId: string,
  filters: { status?: string; type?: string } = {},
): Promise<TrackingItem[]> {
  const conditions = [eq(trackingItem.userId, userId)];
  if (filters.status) {
    conditions.push(
      eq(trackingItem.status, filters.status as TrackingItem["status"]),
    );
  }
  if (filters.type) {
    conditions.push(eq(trackingItem.type, filters.type as TrackingItem["type"]));
  }

  return db
    .select()
    .from(trackingItem)
    .where(and(...conditions))
    .orderBy(desc(trackingItem.createdAt));
}

export async function getTrackingItemById(
  userId: string,
  id: string,
): Promise<TrackingItem> {
  const [item] = await db
    .select()
    .from(trackingItem)
    .where(and(eq(trackingItem.id, id), eq(trackingItem.userId, userId)));

  if (!item) throw new NotFoundError("Tracking item");
  return item;
}

export async function createTrackingItem(
  userId: string,
  input: CreateTrackingItemInput,
): Promise<TrackingItem> {
  const tenureMonths = Number(input.tenureMonths);
  const emiDay = Number(input.emiDay);
  const endDate = computeEndDate(input.startDate, tenureMonths);

  const [created] = await db
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
      outstandingAmount: input.principalAmount,
      tenureMonths,
      emiDay,
      startDate: input.startDate,
      endDate,
      notes: normalizeOptional(input.notes),
    })
    .returning();

  return created;
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
  if (input.lenderName !== undefined) updates.lenderName = normalizeOptional(input.lenderName);
  if (input.accountNumberLast4 !== undefined)
    updates.accountNumberLast4 = normalizeOptional(input.accountNumberLast4);
  if (input.principalAmount !== undefined) updates.principalAmount = input.principalAmount;
  if (input.interestRate !== undefined) updates.interestRate = normalizeOptional(input.interestRate);
  if (input.monthlyEmiAmount !== undefined) updates.monthlyEmiAmount = input.monthlyEmiAmount;
  if (input.outstandingAmount !== undefined) updates.outstandingAmount = input.outstandingAmount;
  if (input.tenureMonths !== undefined) updates.tenureMonths = Number(input.tenureMonths);
  if (input.emiDay !== undefined) updates.emiDay = Number(input.emiDay);
  if (input.notes !== undefined) updates.notes = normalizeOptional(input.notes);
  if (input.status !== undefined) updates.status = input.status;

  if (input.startDate !== undefined || input.tenureMonths !== undefined) {
    const current = await getTrackingItemById(userId, id);
    const startDate = input.startDate ?? current.startDate;
    const tenureMonths = input.tenureMonths !== undefined
      ? Number(input.tenureMonths)
      : current.tenureMonths;
    updates.startDate = startDate;
    updates.endDate = computeEndDate(startDate, tenureMonths);
  }

  const [updated] = await db
    .update(trackingItem)
    .set(updates)
    .where(and(eq(trackingItem.id, id), eq(trackingItem.userId, userId)))
    .returning();

  if (!updated) throw new NotFoundError("Tracking item");
  return updated;
}

export async function deleteTrackingItem(userId: string, id: string): Promise<void> {
  const result = await db
    .delete(trackingItem)
    .where(and(eq(trackingItem.id, id), eq(trackingItem.userId, userId)))
    .returning({ id: trackingItem.id });

  if (result.length === 0) throw new NotFoundError("Tracking item");
}
