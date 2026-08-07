import { useState } from "react";
import Head from "next/head";
import { CalendarClock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddPayableDialog } from "@/components/payables/add-payable-dialog";
import { MarkPaidDialog } from "@/components/payables/mark-paid-dialog";
import { useGeneratePayables, usePayables } from "@/hooks/use-payables";
import { currentBillingPeriod } from "@/lib/dates";
import {
  formatCurrency,
  formatDate,
  payableCategoryLabels,
  payableStatusIcons,
  payableStatusLabels,
} from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { withAuth } from "@/lib/with-auth";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  paid: "default",
  overdue: "destructive",
};

function effectiveStatus(status: string, dueDate: string) {
  if (status === "pending" && dueDate < new Date().toISOString().slice(0, 10)) {
    return "overdue";
  }
  return status;
}

export default function PayablesPage() {
  const [month, setMonth] = useState(currentBillingPeriod());
  const [status, setStatus] = useState<string>("all");
  const {
    data: payables,
    isLoading,
    isError,
  } = usePayables({
    month,
    status: status === "all" ? undefined : status,
  });
  const generateMutation = useGeneratePayables();

  async function handleGenerate() {
    try {
      const result = await generateMutation.mutateAsync(month);
      toast.success(
        `Generated ${result.created} payable${result.created === 1 ? "" : "s"}`,
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <DashboardShell>
      <Head>
        <title>Monthly Payables · PayTrack</title>
      </Head>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly Payables</h1>
          <p className="text-muted-foreground text-sm">
            EMIs generated from tracking items, plus manual bills.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            <RefreshCw
              className={generateMutation.isPending ? "size-4 animate-spin" : "size-4"}
            />
            Generate this month
          </Button>
          <AddPayableDialog />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
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
          icon={CalendarClock}
          title="Couldn't load payables"
          description="Something went wrong loading your data. Try refreshing the page."
        />
      )}

      {!isLoading && !isError && payables && payables.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="Nothing here for this month"
          description="Generate payables from your active tracking items, or add a manual bill."
          action={
            <Button onClick={handleGenerate} className="mt-2">
              <RefreshCw className="size-4" />
              Generate this month
            </Button>
          }
        />
      )}

      {!isLoading && !isError && payables && payables.length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payables.map((payable) => {
                const status = effectiveStatus(payable.status, payable.dueDate);
                return (
                  <TableRow key={payable.id}>
                    <TableCell className="font-medium">{payable.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payableCategoryLabels[payable.category]}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payable.dueDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payable.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={statusVariant[status] ?? "secondary"}
                        icon={payableStatusIcons[status] ?? payableStatusIcons.pending}
                        label={
                          status === "overdue"
                            ? "Overdue"
                            : payableStatusLabels[payable.status]
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {payable.status !== "paid" && (
                        <MarkPaidDialog
                          payable={payable}
                          trigger={
                            <Button size="sm" variant="outline">
                              Mark paid
                            </Button>
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
