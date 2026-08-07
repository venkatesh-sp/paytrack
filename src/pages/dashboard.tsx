import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  History,
  ListChecks,
  PlusCircle,
  Wallet,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardMetrics } from "@/hooks/use-dashboard";
import { formatCurrency, formatDate, payableCategoryLabels } from "@/lib/format";
import { withAuth } from "@/lib/with-auth";

const LoanDistributionChart = dynamic(
  () =>
    import("@/components/dashboard/loan-distribution-chart").then(
      (mod) => mod.LoanDistributionChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-40 w-full" /> },
);

export default function DashboardPage({ firstName }: { firstName: string }) {
  const { data: metrics, isLoading, isError } = useDashboardMetrics();

  return (
    <DashboardShell>
      <Head>
        <title>Dashboard · PayTrack</title>
      </Head>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s an overview of your payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/payables">
              <CalendarClock className="size-4" />
              View payables
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tracking-items/new">
              <PlusCircle className="size-4" />
              Add tracking item
            </Link>
          </Button>
        </div>
      </div>

      {isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load dashboard data"
          description="Something went wrong loading your metrics. Try refreshing the page."
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              label="Active Tracking Items"
              value={metrics.activeTrackingItems}
              format={(v) => Math.round(v).toString()}
              icon={ListChecks}
            />
            <MetricCard
              label="Total Outstanding"
              value={metrics.totalOutstanding}
              format={formatCurrency}
              icon={Wallet}
            />
            <MetricCard
              label="EMI This Month"
              value={metrics.totalEmiThisMonth}
              format={formatCurrency}
              icon={CalendarClock}
            />
            <MetricCard
              label="Paid This Month"
              value={metrics.totalPaidThisMonth}
              format={formatCurrency}
              icon={CheckCircle2}
            />
            <MetricCard
              label="Pending This Month"
              value={metrics.totalPendingThisMonth}
              format={formatCurrency}
              icon={Clock}
              tone="warning"
            />
            <MetricCard
              label="Overdue Payments"
              value={metrics.overdueCount}
              format={(v) => Math.round(v).toString()}
              icon={AlertTriangle}
              tone={metrics.overdueCount > 0 ? "destructive" : "default"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upcoming Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.upcomingPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nothing due in the next 7 days.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {metrics.upcomingPayments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {formatDate(p.dueDate)}
                          </p>
                        </div>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today&apos;s EMI</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.todaysPayables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing due today.</p>
                ) : (
                  <ul className="space-y-3">
                    {metrics.todaysPayables.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <Badge variant="outline" className="mt-1">
                            {payableCategoryLabels[p.category]}
                          </Badge>
                        </div>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.recentPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {metrics.recentPayments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{p.payableTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(p.paymentDate)}
                          </p>
                        </div>
                        <span className="font-medium text-success">
                          {formatCurrency(p.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild variant="link" className="mt-2 h-auto p-0">
                  <Link href="/payment-history">
                    <History className="size-3.5" />
                    View all payment history
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loan Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.loanDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add an active tracking item to see distribution.
                  </p>
                ) : (
                  <LoanDistributionChart data={metrics.loanDistribution} />
                )}
              </CardContent>
            </Card>
          </div>

          {metrics.activeTrackingItems === 0 && (
            <EmptyState
              icon={ListChecks}
              title="No tracking items yet"
              description="Add your first loan, EMI, or credit card to start seeing your dashboard come to life."
              action={
                <Button asChild className="mt-2">
                  <Link href="/tracking-items/new">
                    <PlusCircle className="size-4" />
                    Add tracking item
                  </Link>
                </Button>
              }
            />
          )}
        </>
      )}
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth(async (_ctx, session) => {
  return {
    props: {
      firstName: (session.user as { firstName?: string }).firstName ?? "there",
    },
  };
});
