import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AddTransactionDialog } from "@/components/lending/add-transaction-dialog";
import {
  useDeleteLendingContact,
  useDeleteLendingTransaction,
  useLendingContact,
} from "@/hooks/use-lending";
import { formatCurrency, formatDate, lendingTransactionTypeLabels } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { withAuth } from "@/lib/with-auth";

function balanceBadge(balance: string) {
  const value = Number(balance);
  if (value > 0) {
    return <StatusBadge variant="default" icon={ArrowDownLeft} label="Owes you" />;
  }
  if (value < 0) {
    return <StatusBadge variant="destructive" icon={ArrowUpRight} label="You owe" />;
  }
  return <StatusBadge variant="outline" icon={CheckCircle2} label="Settled" />;
}

export default function LendingContactDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : undefined;
  const { data, isLoading, isError } = useLendingContact(id);
  const deleteContact = useDeleteLendingContact();
  const deleteTransaction = useDeleteLendingTransaction(id ?? "");
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);

  const contact = data?.contact;
  const transactions = data?.transactions ?? [];

  async function handleDeleteContact() {
    if (!id) return;
    try {
      await deleteContact.mutateAsync(id);
      toast.success("Contact deleted");
      router.push("/lending");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  async function handleDeleteTransaction() {
    if (!deleteTransactionId) return;
    try {
      await deleteTransaction.mutateAsync(deleteTransactionId);
      toast.success("Transaction deleted");
      setDeleteTransactionId(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <DashboardShell>
      <Head>
        <title>{contact ? `${contact.name} · PayTrack` : "Contact · PayTrack"}</title>
      </Head>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full max-w-3xl rounded-xl" />
        </div>
      )}

      {isError && <p className="text-muted-foreground text-sm">Contact not found.</p>}

      {contact && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{contact.name}</h1>
                {balanceBadge(contact.balance)}
              </div>
              <p className="text-muted-foreground text-sm">
                {contact.phone ?? "No phone on file"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AddTransactionDialog
                contactId={contact.id}
                trigger={
                  <Button>
                    <PlusCircle className="size-4" />
                    Add transaction
                  </Button>
                }
              />
              <Button variant="outline" asChild>
                <Link href={`/lending/${contact.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <AlertDialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this contact?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes &quot;{contact.name}&quot; and its entire transaction
                      history. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteContact}
                      className="bg-destructive hover:bg-destructive/90 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Card className="max-w-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium">
                Current balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {formatCurrency(Math.abs(Number(contact.balance)))}
              </p>
            </CardContent>
          </Card>

          {contact.notes && (
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transactions</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground px-6 pb-6 text-sm">
                  No transactions yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(transaction.transactionDate)}
                        </TableCell>
                        <TableCell>
                          {lendingTransactionTypeLabels[transaction.type]}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.note ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTransactionId(transaction.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog
        open={!!deleteTransactionId}
        onOpenChange={(open) => !open && setDeleteTransactionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This reverses its effect on the contact&apos;s balance. This can&apos;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
