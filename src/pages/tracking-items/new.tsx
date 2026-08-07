import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackingItemForm } from "@/components/tracking-items/tracking-item-form";
import { useCreateTrackingItem } from "@/hooks/use-tracking-items";
import { ApiError } from "@/lib/api/client";
import { withAuth } from "@/lib/with-auth";
import type { CreateTrackingItemInput } from "@/lib/validations/tracking-item";

export default function NewTrackingItemPage() {
  const router = useRouter();
  const createMutation = useCreateTrackingItem();

  async function handleSubmit(values: CreateTrackingItemInput) {
    try {
      const { item } = await createMutation.mutateAsync(values);
      toast.success("Tracking item created");
      router.push(`/tracking-items/${item.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <DashboardShell>
      <Head>
        <title>Add tracking item · PayTrack</title>
      </Head>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add tracking item</h1>
        <p className="text-sm text-muted-foreground">
          Add a loan, EMI, or credit card to start tracking payments.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TrackingItemForm onSubmit={handleSubmit} submitLabel="Create tracking item" />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
