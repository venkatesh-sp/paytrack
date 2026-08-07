import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LendingContactForm } from "@/components/lending/lending-contact-form";
import { useCreateLendingContact } from "@/hooks/use-lending";
import { ApiError } from "@/lib/api/client";
import { withAuth } from "@/lib/with-auth";
import type { CreateLendingContactInput } from "@/lib/validations/lending";

export default function NewLendingContactPage() {
  const router = useRouter();
  const createMutation = useCreateLendingContact();

  async function handleSubmit(values: CreateLendingContactInput) {
    try {
      const { contact } = await createMutation.mutateAsync(values);
      toast.success("Contact added");
      router.push(`/lending/${contact.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <DashboardShell>
      <Head>
        <title>Add contact · PayTrack</title>
      </Head>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add contact</h1>
        <p className="text-muted-foreground text-sm">
          Add someone you&apos;ve lent money to or borrowed from.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <LendingContactForm onSubmit={handleSubmit} submitLabel="Add contact" />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
