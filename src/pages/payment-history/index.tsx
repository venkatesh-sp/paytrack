import Head from "next/head";
import { History } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaymentHistory } from "@/hooks/use-payables";
import { formatCurrency, formatDate, payableCategoryLabels } from "@/lib/format";
import { withAuth } from "@/lib/with-auth";
import { ExportButton } from "@/components/export-button";

export default function PaymentHistoryPage() {
  const { data: history, isLoading, isError } = usePaymentHistory();

  return (
    <DashboardShell>
      <Head>
        <title>Payment History · PayTrack</title>
      </Head>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground text-sm">
            A permanent, auditable record of every payment you&apos;ve made.
          </p>
        </div>
        {history && history.length > 0 && <ExportButton />}
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
          icon={History}
          title="Couldn't load payment history"
          description="Something went wrong loading your data. Try refreshing the page."
        />
      )}

      {!isLoading && !isError && history && history.length === 0 && (
        <EmptyState
          icon={History}
          title="No payments recorded yet"
          description="Once you mark a payable as paid, it will show up here permanently."
        />
      )}

      {!isLoading && !isError && history && history.length > 0 && (
        <div className="space-y-3 md:hidden">
          {history.map((entry) => (
            <div key={entry.id} className="space-y-2 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{entry.payableTitle}</p>
                  <p className="text-muted-foreground text-xs">
                    {payableCategoryLabels[entry.payableCategory]} ·{" "}
                    {formatDate(entry.paymentDate)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatCurrency(entry.amount)}</p>
              </div>
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                {entry.paymentMethod ? (
                  <Badge variant="outline">{entry.paymentMethod}</Badge>
                ) : (
                  <span>—</span>
                )}
                <span>
                  Outstanding after:{" "}
                  {entry.outstandingAfter ? formatCurrency(entry.outstandingAfter) : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && history && history.length > 0 && (
        <div className="hidden overflow-hidden rounded-xl border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payable</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Outstanding after</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.payableTitle}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {payableCategoryLabels[entry.payableCategory]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(entry.paymentDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(entry.amount)}
                  </TableCell>
                  <TableCell>
                    {entry.paymentMethod ? (
                      <Badge variant="outline">{entry.paymentMethod}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {entry.outstandingAfter
                      ? formatCurrency(entry.outstandingAfter)
                      : "—"}
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
