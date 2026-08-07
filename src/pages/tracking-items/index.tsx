import Head from "next/head";
import Link from "next/link";
import { CircleDot, ListChecks, PlusCircle } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTrackingItems } from "@/hooks/use-tracking-items";
import {
  formatCurrency,
  formatDate,
  trackingItemStatusIcons,
  trackingItemStatusLabels,
  trackingItemTypeLabels,
} from "@/lib/format";
import { withAuth } from "@/lib/with-auth";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  closed: "outline",
};

export default function TrackingItemsPage() {
  const { data: items, isLoading, isError } = useTrackingItems();

  return (
    <DashboardShell>
      <Head>
        <title>Tracking Items · PayTrack</title>
      </Head>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tracking Items</h1>
          <p className="text-muted-foreground text-sm">
            Loans, EMIs, and credit cards you&apos;re tracking.
          </p>
        </div>
        <Button asChild>
          <Link href="/tracking-items/new">
            <PlusCircle className="size-4" />
            Add tracking item
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={ListChecks}
          title="Couldn't load tracking items"
          description="Something went wrong loading your data. Try refreshing the page."
        />
      )}

      {!isLoading && !isError && items && items.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title="No tracking items yet"
          description="Add your first loan, EMI, or credit card to start tracking payments."
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

      {!isLoading && !isError && items && items.length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Monthly EMI</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>End date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer">
                  <TableCell className="p-0">
                    <Link
                      href={`/tracking-items/${item.id}`}
                      className="block px-2 py-2 font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {trackingItemTypeLabels[item.type]}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      variant={statusVariant[item.status] ?? "default"}
                      icon={trackingItemStatusIcons[item.status] ?? CircleDot}
                      label={trackingItemStatusLabels[item.status]}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.monthlyEmiAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.outstandingAmount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(item.endDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
