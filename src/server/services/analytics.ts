import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { monthlyPayable, paymentHistory, trackingItem } from "@/db/schema";
import type { AnalyticsFilters } from "@/lib/validations/analytics";

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function periodsForYear(year: number): string[] {
  return Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
  );
}

/**
 * Resolves the set of tracking-item ids every analytics query should be
 * scoped to, combining the type filter and the explicit multi-select
 * tracking-item filter (both, when both are given). Returns null when
 * neither filter is set, meaning "every tracking item" — callers must treat
 * that distinctly from an empty array (which means "none match").
 */
async function resolveTrackingItemIds(
  userId: string,
  filters: AnalyticsFilters,
): Promise<string[] | null> {
  if (!filters.type && !filters.trackingItemIds?.length) return null;

  const conditions = [eq(trackingItem.userId, userId)];
  if (filters.type) {
    conditions.push(eq(trackingItem.type, filters.type as never));
  }
  if (filters.trackingItemIds?.length) {
    conditions.push(inArray(trackingItem.id, filters.trackingItemIds));
  }

  const items = await db
    .select({ id: trackingItem.id })
    .from(trackingItem)
    .where(and(...conditions));
  return items.map((i) => i.id);
}

export async function getMonthlyEmiTrend(userId: string, filters: AnalyticsFilters) {
  const periods = periodsForYear(filters.year ?? new Date().getFullYear());
  const itemIds = await resolveTrackingItemIds(userId, filters);

  const conditions = [
    eq(monthlyPayable.userId, userId),
    eq(monthlyPayable.category, "emi"),
    gte(monthlyPayable.billingPeriod, periods[0]),
  ];
  if (itemIds !== null) {
    conditions.push(
      itemIds.length > 0 ? inArray(monthlyPayable.trackingItemId, itemIds) : sql`false`,
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
  const periods = periodsForYear(filters.year ?? new Date().getFullYear());
  const itemIds = await resolveTrackingItemIds(userId, filters);

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

  const paymentConditions = [
    eq(paymentHistory.userId, userId),
    sql`${paymentHistory.trackingItemId} is not null`,
  ];
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
    const monthEnd = new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0)
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
  const itemIds = await resolveTrackingItemIds(userId, filters);

  const conditions = [eq(monthlyPayable.userId, userId)];
  if (period) {
    conditions.push(eq(monthlyPayable.billingPeriod, period));
  } else {
    conditions.push(sql`${monthlyPayable.billingPeriod} like ${year + "-%"}`);
  }
  if (itemIds !== null) {
    conditions.push(
      itemIds.length > 0 ? inArray(monthlyPayable.trackingItemId, itemIds) : sql`false`,
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

/**
 * Amount owed per tracking item within the selected period — a part-to-whole
 * breakdown for the "Tracking Items" pie chart. Naturally reflects the
 * multi-select tracking-item filter (and the type filter) via
 * `resolveTrackingItemIds`, same as every other analytics query, so
 * selecting specific items narrows this chart to just those items.
 */
export async function getTrackingItemDistribution(
  userId: string,
  filters: AnalyticsFilters,
) {
  const period = filters.month ?? null;
  const year = filters.year ?? new Date().getFullYear();
  const itemIds = await resolveTrackingItemIds(userId, filters);

  const conditions = [eq(monthlyPayable.userId, userId)];
  if (period) {
    conditions.push(eq(monthlyPayable.billingPeriod, period));
  } else {
    conditions.push(sql`${monthlyPayable.billingPeriod} like ${year + "-%"}`);
  }
  if (itemIds !== null) {
    conditions.push(
      itemIds.length > 0 ? inArray(monthlyPayable.trackingItemId, itemIds) : sql`false`,
    );
  }

  const rows = await db
    .select({
      trackingItemId: trackingItem.id,
      name: trackingItem.name,
      total: sql<string>`sum(${monthlyPayable.amount})`,
    })
    .from(monthlyPayable)
    .innerJoin(trackingItem, eq(monthlyPayable.trackingItemId, trackingItem.id))
    .where(and(...conditions))
    .groupBy(trackingItem.id, trackingItem.name);

  return rows.map((r) => ({
    id: r.trackingItemId,
    name: r.name,
    amount: toNumber(r.total),
  }));
}

export async function getPaidVsPending(userId: string, filters: AnalyticsFilters) {
  const period = filters.month ?? null;
  const year = filters.year ?? new Date().getFullYear();
  const itemIds = await resolveTrackingItemIds(userId, filters);

  const conditions = [eq(monthlyPayable.userId, userId)];
  if (period) {
    conditions.push(eq(monthlyPayable.billingPeriod, period));
  } else {
    conditions.push(sql`${monthlyPayable.billingPeriod} like ${year + "-%"}`);
  }
  if (itemIds !== null) {
    conditions.push(
      itemIds.length > 0 ? inArray(monthlyPayable.trackingItemId, itemIds) : sql`false`,
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
  const itemIds = await resolveTrackingItemIds(userId, filters);

  const conditions = [
    eq(monthlyPayable.userId, userId),
    sql`${monthlyPayable.billingPeriod} like ${year + "-%"}`,
  ];
  if (itemIds !== null) {
    conditions.push(
      itemIds.length > 0 ? inArray(monthlyPayable.trackingItemId, itemIds) : sql`false`,
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
  const [
    emiTrend,
    outstandingTrend,
    categoryDistribution,
    trackingItemDistribution,
    paidVsPending,
    yearlySummary,
  ] = await Promise.all([
    getMonthlyEmiTrend(userId, filters),
    getOutstandingTrend(userId, filters),
    getCategoryDistribution(userId, filters),
    getTrackingItemDistribution(userId, filters),
    getPaidVsPending(userId, filters),
    getYearlySummary(userId, filters),
  ]);

  return {
    emiTrend,
    outstandingTrend,
    categoryDistribution,
    trackingItemDistribution,
    paidVsPending,
    yearlySummary,
  };
}
