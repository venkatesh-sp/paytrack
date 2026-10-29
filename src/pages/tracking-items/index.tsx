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
import {
  ExportLinkButton,
  ImportFileButton,
} from "@/components/data-transfer/export-import-buttons";
import { useTrackingItems } from "@/hooks/use-tracking-items";
import { useImportTrackingItems } from "@/hooks/use-data-transfer";
import { trackingItemsExportUrl } from "@/lib/api/data-transfer";
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
  const importMutation = useImportTrackingItems();

  return (
    <DashboardShell>
      <Head>
        <title>Tracking Items · PayTrack</title>
      </Head>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tracking Items</h1>
          <p className="text-muted-foreground text-sm">
            Loans, EMIs, and credit cards you&apos;re tracking.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportLinkButton href={trackingItemsExportUrl()} label="Export" />
          <ImportFileButton
            label="Import"
            onImport={(data) => importMutation.mutateAsync(data)}
            describeResult={(result) => {
              const r = result as { itemsImported: number; payablesImported: number };
              return `Imported ${r.itemsImported} tracking item(s) and ${r.payablesImported} payable(s).`;
            }}
          />
          <Button asChild>
            <Link href="/tracking-items/new">
              <PlusCircle className="size-4" />
              Add tracking item
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground -mt-2 text-xs">
        Import adds items from a PayTrack export file — it never overwrites or removes
        existing data.
      </p>

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
        <div className="space-y-3 md:hidden">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/tracking-items/${item.id}`}
              className="active:bg-muted/50 block space-y-3 rounded-xl border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {trackingItemTypeLabels[item.type]}
                    {item.interestRate ? ` · ${item.interestRate}%` : ""}
                  </p>
                </div>
                <StatusBadge
                  variant={statusVariant[item.status] ?? "default"}
                  icon={trackingItemStatusIcons[item.status] ?? CircleDot}
                  label={trackingItemStatusLabels[item.status]}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Monthly EMI</p>
                  <p className="font-medium">{formatCurrency(item.monthlyEmiAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Paid / Pending</p>
                  <p className="font-medium">
                    {item.paidEmiCount} / {item.pendingEmiCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Outstanding</p>
                  <p className="font-medium">{formatCurrency(item.outstandingAmount)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !isError && items && items.length > 0 && (
        <div className="hidden overflow-hidden rounded-xl border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>

                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead className="text-right">Total EMIs</TableHead>
                <TableHead className="text-right">Monthly EMI</TableHead>
                <TableHead className="text-right">Paid EMIs</TableHead>
                <TableHead className="text-right">Pending EMIs</TableHead>
                <TableHead className="text-right">Paid Amount</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">End date</TableHead>
                <TableHead>Status</TableHead>
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

                  <TableCell className="text-right">
                    {formatCurrency(item.principalAmount)}
                  </TableCell>

                  <TableCell className="text-right">{item.interestRate}%</TableCell>
                  <TableCell className="text-right">{item.tenureMonths}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.monthlyEmiAmount)}
                  </TableCell>
                  <TableCell className="text-right">{item.paidEmiCount}</TableCell>
                  <TableCell className="text-right">{item.pendingEmiCount}</TableCell>

                  <TableCell className="text-right">
                    {formatCurrency(Number(item.monthlyEmiAmount) * item.paidEmiCount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(item.monthlyEmiAmount) * item.pendingEmiCount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {formatDate(item.endDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      variant={statusVariant[item.status] ?? "default"}
                      icon={trackingItemStatusIcons[item.status] ?? CircleDot}
                      label={trackingItemStatusLabels[item.status]}
                    />
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
