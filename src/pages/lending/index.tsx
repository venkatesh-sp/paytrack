import Head from "next/head";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  HandCoins,
  PlusCircle,
} from "lucide-react";

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
import { useLendingContacts } from "@/hooks/use-lending";
import { formatCurrency } from "@/lib/format";
import { withAuth } from "@/lib/with-auth";

function balanceBadge(balance: string) {
  const value = Number(balance);
  if (value > 0) {
    return (
      <StatusBadge
        variant="default"
        icon={ArrowDownLeft}
        label={`Owes you ${formatCurrency(value)}`}
      />
    );
  }
  if (value < 0) {
    return (
      <StatusBadge
        variant="destructive"
        icon={ArrowUpRight}
        label={`You owe ${formatCurrency(Math.abs(value))}`}
      />
    );
  }
  return <StatusBadge variant="outline" icon={CheckCircle2} label="Settled" />;
}

export default function LendingPage() {
  const { data: contacts, isLoading, isError } = useLendingContacts();

  return (
    <DashboardShell>
      <Head>
        <title>Lending · PayTrack</title>
      </Head>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lending</h1>
          <p className="text-muted-foreground text-sm">
            Track money you&apos;ve lent to or borrowed from people.
          </p>
        </div>
        <Button asChild>
          <Link href="/lending/new">
            <PlusCircle className="size-4" />
            Add contact
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
          icon={HandCoins}
          title="Couldn't load contacts"
          description="Something went wrong loading your data. Try refreshing the page."
        />
      )}

      {!isLoading && !isError && contacts && contacts.length === 0 && (
        <EmptyState
          icon={HandCoins}
          title="No contacts yet"
          description="Add someone you've lent money to or borrowed from to start tracking it."
          action={
            <Button asChild className="mt-2">
              <Link href="/lending/new">
                <PlusCircle className="size-4" />
                Add contact
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading && !isError && contacts && contacts.length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} className="cursor-pointer">
                  <TableCell className="p-0">
                    <Link
                      href={`/lending/${contact.id}`}
                      className="block px-2 py-2 font-medium hover:underline"
                    >
                      {contact.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.phone ?? "—"}
                  </TableCell>
                  <TableCell>{balanceBadge(contact.balance)}</TableCell>
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
