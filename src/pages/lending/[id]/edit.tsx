import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LendingContactForm } from "@/components/lending/lending-contact-form";
import { useLendingContact, useUpdateLendingContact } from "@/hooks/use-lending";
import { ApiError } from "@/lib/api/client";
import { withAuth } from "@/lib/with-auth";
import type { CreateLendingContactInput } from "@/lib/validations/lending";

export default function EditLendingContactPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : undefined;
  const { data, isLoading } = useLendingContact(id);
  const updateMutation = useUpdateLendingContact(id ?? "");

  async function handleSubmit(values: CreateLendingContactInput) {
    if (!id) return;
    try {
      await updateMutation.mutateAsync(values);
      toast.success("Contact updated");
      router.push(`/lending/${id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  const contact = data?.contact;

  return (
    <DashboardShell>
      <Head>
        <title>
          {contact ? `Edit ${contact.name} · PayTrack` : "Edit contact · PayTrack"}
        </title>
      </Head>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit contact</h1>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-64 w-full" />}
          {contact && (
            <LendingContactForm
              defaultValues={{
                name: contact.name,
                phone: contact.phone ?? "",
                notes: contact.notes ?? "",
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
