import { and, asc, count, desc, eq, gte, lt, lte, sum } from "drizzle-orm";
import { db } from "@/db";
import { monthlyPayable, paymentHistory, trackingItem } from "@/db/schema";
import { currentBillingPeriod } from "@/lib/dates";

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function getDashboardMetrics(userId: string) {
  const period = currentBillingPeriod();
  const today = new Date().toISOString().slice(0, 10);
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [activeSummary] = await db
    .select({
      activeCount: count(trackingItem.id),
      totalOutstanding: sum(trackingItem.outstandingAmount),
    })
    .from(trackingItem)
    .where(and(eq(trackingItem.userId, userId), eq(trackingItem.status, "active")));

  const monthPayables = await db
    .select()
    .from(monthlyPayable)
    .where(and(eq(monthlyPayable.userId, userId), eq(monthlyPayable.billingPeriod, period)));

  const totalEmiThisMonth = monthPayables
    .filter((p) => p.category === "emi")
    .reduce((sum, p) => sum + toNumber(p.amount), 0);
  const totalPaidThisMonth = monthPayables.reduce((sum, p) => sum + toNumber(p.paidAmount), 0);
  const totalPendingThisMonth = monthPayables
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + (toNumber(p.amount) - toNumber(p.paidAmount)), 0);

  const upcomingPayments = await db
    .select()
    .from(monthlyPayable)
    .where(
      and(
        eq(monthlyPayable.userId, userId),
        eq(monthlyPayable.status, "pending"),
        gte(monthlyPayable.dueDate, today),
        lte(monthlyPayable.dueDate, in7Days),
      ),
    )
    .orderBy(asc(monthlyPayable.dueDate))
    .limit(5);

  const [overdueSummary] = await db
    .select({ overdueCount: count(monthlyPayable.id) })
    .from(monthlyPayable)
    .where(
      and(
        eq(monthlyPayable.userId, userId),
        eq(monthlyPayable.status, "pending"),
        lt(monthlyPayable.dueDate, today),
      ),
    );

  const todaysPayables = await db
    .select()
    .from(monthlyPayable)
    .where(
      and(
        eq(monthlyPayable.userId, userId),
        eq(monthlyPayable.dueDate, today),
        eq(monthlyPayable.status, "pending"),
      ),
    );

  const recentPaymentsRaw = await db
    .select({
      payment: paymentHistory,
      payableTitle: monthlyPayable.title,
    })
    .from(paymentHistory)
    .innerJoin(monthlyPayable, eq(paymentHistory.monthlyPayableId, monthlyPayable.id))
    .where(eq(paymentHistory.userId, userId))
    .orderBy(desc(paymentHistory.recordedAt))
    .limit(5);

  const loanDistributionRaw = await db
    .select({
      type: trackingItem.type,
      totalOutstanding: sum(trackingItem.outstandingAmount),
    })
    .from(trackingItem)
    .where(and(eq(trackingItem.userId, userId), eq(trackingItem.status, "active")))
    .groupBy(trackingItem.type);

  return {
    activeTrackingItems: activeSummary?.activeCount ?? 0,
    totalOutstanding: toNumber(activeSummary?.totalOutstanding),
    totalEmiThisMonth,
    totalPaidThisMonth,
    totalPendingThisMonth,
    overdueCount: overdueSummary?.overdueCount ?? 0,
    upcomingPayments,
    todaysPayables,
    recentPayments: recentPaymentsRaw.map((r) => ({ ...r.payment, payableTitle: r.payableTitle })),
    loanDistribution: loanDistributionRaw.map((row) => ({
      type: row.type,
      outstanding: toNumber(row.totalOutstanding),
    })),
  };
}
