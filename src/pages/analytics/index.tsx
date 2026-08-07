import { useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { BarChart3, CalendarClock, CheckCircle2, Receipt, Wallet } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ExportButton } from "@/components/export-button";
import { PaidVsPendingBar } from "@/components/analytics/paid-vs-pending-bar";
import { useAnalytics } from "@/hooks/use-analytics";
import { formatCurrency, trackingItemTypeLabels } from "@/lib/format";
import { trackingItemTypeValues } from "@/lib/validations/tracking-item";
import { withAuth } from "@/lib/with-auth";

const TrendChart = dynamic(
  () => import("@/components/analytics/trend-chart").then((m) => m.TrendChart),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full" /> },
);
const CategoryDistributionChart = dynamic(
  () =>
    import("@/components/analytics/category-distribution-chart").then(
      (m) => m.CategoryDistributionChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-40 w-full" /> },
);

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2];

export default function AnalyticsPage() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("");
  const [type, setType] = useState<string>("all");

  const { data, isLoading, isError } = useAnalytics({
    year: month ? undefined : year,
    month: month || undefined,
    type: type === "all" ? undefined : type,
  });

  return (
    <DashboardShell>
      <Head>
        <title>Analytics · PayTrack</title>
      </Head>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Trends and breakdowns across your loans, EMIs, and bills.
          </p>
        </div>
        <ExportButton
          filters={{ year: month ? undefined : year, month: month || undefined, type: type === "all" ? undefined : type }}
          subtitle={`${month || `Year ${year}`}${type !== "all" ? ` · ${trackingItemTypeLabels[type]}` : ""}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(year)}
          onValueChange={(v) => {
            setYear(Number(v));
            setMonth("");
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
        />
        {month && (
          <Button variant="ghost" size="sm" onClick={() => setMonth("")}>
            Clear month
          </Button>
        )}

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All loan types</SelectItem>
            {trackingItemTypeValues.map((t) => (
              <SelectItem key={t} value={t}>
                {trackingItemTypeLabels[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <EmptyState
          icon={BarChart3}
          title="Couldn't load analytics"
          description="Something went wrong loading your data. Try refreshing the page."
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label={`Total EMI (${data.yearlySummary.year})`}
              value={data.yearlySummary.totalEmi}
              format={formatCurrency}
              icon={CalendarClock}
            />
            <MetricCard
              label={`Total Paid (${data.yearlySummary.year})`}
              value={data.yearlySummary.totalPaid}
              format={formatCurrency}
              icon={CheckCircle2}
            />
            <MetricCard
              label={`Total Pending (${data.yearlySummary.year})`}
              value={data.yearlySummary.totalPending}
              format={formatCurrency}
              icon={Wallet}
            />
            <MetricCard
              label={`Payments Made (${data.yearlySummary.year})`}
              value={data.yearlySummary.paymentCount}
              format={(v) => Math.round(v).toString()}
              icon={Receipt}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly EMI Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={data.emiTrend} dataKey="amount" color="var(--chart-1)" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Outstanding Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart
                  data={data.outstandingTrend}
                  dataKey="outstanding"
                  color="var(--chart-2)"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {data.categoryDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No payables in this period.
                  </p>
                ) : (
                  <CategoryDistributionChart data={data.categoryDistribution} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paid vs Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <PaidVsPendingBar paid={data.paidVsPending.paid} pending={data.paidVsPending.pending} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
