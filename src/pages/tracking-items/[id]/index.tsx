import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteTrackingItem, useTrackingItem } from "@/hooks/use-tracking-items";
import {
  formatCurrency,
  formatDate,
  trackingItemStatusLabels,
  trackingItemTypeLabels,
} from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { withAuth } from "@/lib/with-auth";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  closed: "outline",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function TrackingItemDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : undefined;
  const { data: item, isLoading, isError } = useTrackingItem(id);
  const deleteMutation = useDeleteTrackingItem();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Tracking item deleted");
      router.push("/tracking-items");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <DashboardShell>
      <Head>
        <title>{item ? `${item.name} · PayTrack` : "Tracking item · PayTrack"}</title>
      </Head>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full max-w-3xl rounded-xl" />
        </div>
      )}

      {isError && <p className="text-sm text-muted-foreground">Tracking item not found.</p>}

      {item && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
                <Badge variant={statusVariant[item.status] ?? "default"}>
                  {trackingItemStatusLabels[item.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {trackingItemTypeLabels[item.type]}
                {item.lenderName ? ` · ${item.lenderName}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/tracking-items/${item.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this tracking item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes &quot;{item.name}&quot; from your tracking items.
                      Existing payables and payment history stay intact for your
                      records, but will no longer be linked to this item.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatCurrency(item.outstandingAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Monthly EMI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatCurrency(item.monthlyEmiAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Principal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatCurrency(item.principalAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Interest rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {item.interestRate ? `${item.interestRate}%` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Start date" value={formatDate(item.startDate)} />
              <Field label="End date" value={formatDate(item.endDate)} />
              <Field label="Tenure" value={`${item.tenureMonths} months`} />
              <Field label="EMI day" value={`Day ${item.emiDay} of month`} />
              <Field
                label="Account"
                value={item.accountNumberLast4 ? `•••• ${item.accountNumberLast4}` : "—"}
              />
              <Field label="Created" value={formatDate(item.createdAt)} />
              {item.notes && (
                <div className="col-span-full">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
