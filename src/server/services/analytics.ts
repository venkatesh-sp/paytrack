import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { monthlyPayable, paymentHistory, trackingItem } from "@/db/schema";
import type { AnalyticsFilters } from "@/lib/validations/analytics";

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function lastNPeriods(n: number): string[] {
  const periods: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return periods;
}

async function trackingItemIdsForType(userId: string, type?: string): Promise<string[] | null> {
  if (!type) return null;
  const items = await db
    .select({ id: trackingItem.id })
    .from(trackingItem)
    .where(and(eq(trackingItem.userId, userId), eq(trackingItem.type, type as never)));
  return items.map((i) => i.id);
}

export async function getMonthlyEmiTrend(userId: string, filters: AnalyticsFilters) {
  const periods = lastNPeriods(12);
  const itemIds = await trackingItemIdsForType(userId, filters.type);

  const conditions = [
    eq(monthlyPayable.userId, userId),
    eq(monthlyPayable.category, "emi"),
    gte(monthlyPayable.billingPeriod, periods[0]),
  ];
  if (itemIds !== null) {
    conditions.push(
      itemIds.length > 0
        ? inArray(monthlyPayable.trackingItemId, itemIds)
        : sql`false`,
    );
  }

  const rows = await db
    .select({
      billingPeriod: monthlyPayable.billingPeriod,
      total: sql<string>`sum(${monthlyPayable.amount})`,
    })
    .from(monthlyPayable)
    .where(and(...conditions))
    .groupBy(monthlyPayable.billingPeriod);

  const byPeriod = new Map(rows.map((r) => [r.billingPeriod, toNumber(r.total)]));
  return periods.map((period) => ({ period, amount: byPeriod.get(period) ?? 0 }));
}

export async function getOutstandingTrend(userId: string, filters: AnalyticsFilters) {
  const periods = lastNPeriods(12);
  const itemIds = await trackingItemIdsForType(userId, filters.type);

  const itemConditions = [eq(trackingItem.userId, userId)];
  if (itemIds !== null) {
    itemConditions.push(
      itemIds.length > 0 ? inArray(trackingItem.id, itemIds) : sql`false`,
    );
  }

  const [currentTotal] = await db
    .select({ total: sql<string>`coalesce(sum(${trackingItem.outstandingAmount}), 0)` })
    .from(trackingItem)
    .where(and(...itemConditions));

  const paymentConditions = [eq(paymentHistory.userId, userId), sql`${paymentHistory.trackingItemId} is not null`];
  if (itemIds !== null) {
    paymentConditions.push(
      itemIds.length > 0 ? inArray(paymentHistory.trackingItemId, itemIds) : sql`false`,
    );
  }

  const payments = await db
    .select({ amount: paymentHistory.amount, paymentDate: paymentHistory.paymentDate })
    .from(paymentHistory)
    .where(and(...paymentConditions));

  // Outstanding at the end of month M equals current outstanding plus every
  // payment made after month M (those payments hadn't happened yet then).
  const current = toNumber(currentTotal?.total);
  return periods.map((period) => {
    const monthEnd = new Date(
      Number(period.slice(0, 4)),
      Number(period.slice(5, 7)),
      0,
    )
      .toISOString()
      .slice(0, 10);
    const paidAfter = payments
      .filter((p) => p.paymentDate > monthEnd)
      .reduce((sum, p) => sum + toNumber(p.amount), 0);
    return { period, outstanding: current + paidAfter };
  });
}

export async function getCategoryDistribution(userId: string, filters: AnalyticsFilters) {
  const period = filters.month ?? null;
  const year = filters.year ?? new Date().getFullYear();
  const itemIds = await trackingItemIdsForType(userId, filters.type);

  const conditions = [eq(monthlyPayable.userId, userId)];
  if (period) {
    conditions.push(eq(monthlyPayable.billingPeriod, period));
  } else {
    conditions.push(sql`${monthlyPayable.billingPeriod} like ${year + "-%"}`);
  }
  if (itemIds !== null) {
    conditions.push(
      itemIds.length > 0
        ? inArray(monthlyPayable.trackingItemId, itemIds)
        : sql`false`,
    );
  }

  const rows = await db
    .select({
      category: monthlyPayable.category,
      total: sql<string>`sum(${monthlyPayable.amount})`,
    })
    .from(monthlyPayable)
    .where(and(...conditions))
    .groupBy(monthlyPayable.category);

  return rows.map((r) => ({ category: r.category, amount: toNumber(r.total) }));
}

export async function getPaidVsPending(userId: string, filters: AnalyticsFilters) {
  const period = filters.month ?? null;
  const year = filters.year ?? new Date().getFullYear();
  const itemIds = await trackingItemIdsForType(userId, filters.type);

  const conditions = [eq(monthlyPayable.userId, userId)];
  if (period) {
    conditions.push(eq(monthlyPayable.billingPeriod, period));
  } else {
    conditions.push(sql`${monthlyPayable.billingPeriod} like ${year + "-%"}`);
  }
  if (itemIds !== null) {
    conditions.push(
      itemIds.length > 0
        ? inArray(monthlyPayable.trackingItemId, itemIds)
        : sql`false`,
    );
  }

  const [row] = await db
    .select({
      totalAmount: sql<string>`coalesce(sum(${monthlyPayable.amount}), 0)`,
      totalPaid: sql<string>`coalesce(sum(${monthlyPayable.paidAmount}), 0)`,
    })
    .from(monthlyPayable)
    .where(and(...conditions));

  const paid = toNumber(row?.totalPaid);
  const total = toNumber(row?.totalAmount);
  return { paid, pending: Math.max(0, total - paid) };
}

export async function getYearlySummary(userId: string, filters: AnalyticsFilters) {
  const year = filters.year ?? new Date().getFullYear();
  const itemIds = await trackingItemIdsForType(userId, filters.type);

  const conditions = [
    eq(monthlyPayable.userId, userId),
    sql`${monthlyPayable.billingPeriod} like ${year + "-%"}`,
  ];
  if (itemIds !== null) {
    conditions.push(
      itemIds.length > 0
        ? inArray(monthlyPayable.trackingItemId, itemIds)
        : sql`false`,
    );
  }

  const [row] = await db
    .select({
      totalEmi: sql<string>`coalesce(sum(${monthlyPayable.amount}) filter (where ${monthlyPayable.category} = 'emi'), 0)`,
      totalPaid: sql<string>`coalesce(sum(${monthlyPayable.paidAmount}), 0)`,
      totalAmount: sql<string>`coalesce(sum(${monthlyPayable.amount}), 0)`,
      paymentCount: sql<string>`count(*) filter (where ${monthlyPayable.status} = 'paid')`,
    })
    .from(monthlyPayable)
    .where(and(...conditions));

  const totalPaid = toNumber(row?.totalPaid);
  const totalAmount = toNumber(row?.totalAmount);

  return {
    year,
    totalEmi: toNumber(row?.totalEmi),
    totalPaid,
    totalPending: Math.max(0, totalAmount - totalPaid),
    paymentCount: toNumber(row?.paymentCount),
  };
}

export async function getAnalytics(userId: string, filters: AnalyticsFilters) {
  const [emiTrend, outstandingTrend, categoryDistribution, paidVsPending, yearlySummary] =
    await Promise.all([
      getMonthlyEmiTrend(userId, filters),
      getOutstandingTrend(userId, filters),
      getCategoryDistribution(userId, filters),
      getPaidVsPending(userId, filters),
      getYearlySummary(userId, filters),
    ]);

  return { emiTrend, outstandingTrend, categoryDistribution, paidVsPending, yearlySummary };
}
