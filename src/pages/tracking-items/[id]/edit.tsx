import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackingItemForm } from "@/components/tracking-items/tracking-item-form";
import { useTrackingItem, useUpdateTrackingItem } from "@/hooks/use-tracking-items";
import { ApiError } from "@/lib/api/client";
import { withAuth } from "@/lib/with-auth";
import type { CreateTrackingItemInput } from "@/lib/validations/tracking-item";

export default function EditTrackingItemPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : undefined;
  const { data: item, isLoading } = useTrackingItem(id);
  const updateMutation = useUpdateTrackingItem(id ?? "");

  async function handleSubmit(values: CreateTrackingItemInput) {
    if (!id) return;
    try {
      await updateMutation.mutateAsync(values);
      toast.success("Tracking item updated");
      router.push(`/tracking-items/${id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <DashboardShell>
      <Head>
        <title>{item ? `Edit ${item.name} · PayTrack` : "Edit tracking item · PayTrack"}</title>
      </Head>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit tracking item</h1>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-96 w-full" />}
          {item && (
            <TrackingItemForm
              defaultValues={{
                name: item.name,
                type: item.type,
                lenderName: item.lenderName ?? "",
                accountNumberLast4: item.accountNumberLast4 ?? "",
                principalAmount: item.principalAmount,
                interestRate: item.interestRate ?? "",
                monthlyEmiAmount: item.monthlyEmiAmount,
                tenureMonths: String(item.tenureMonths),
                emiDay: String(item.emiDay),
                startDate: item.startDate,
                notes: item.notes ?? "",
              }}
              onSubmit={handleSubmit}
              submitLabel="Save changes"
            />
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
