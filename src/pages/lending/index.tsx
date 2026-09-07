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
import { MetricCard } from "@/components/dashboard/metric-card";
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
import { useLendingContacts, useLendingSummary } from "@/hooks/use-lending";
import { useImportLending } from "@/hooks/use-data-transfer";
import { lendingExportUrl } from "@/lib/api/data-transfer";
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
  const { data: summary, isLoading: isSummaryLoading } = useLendingSummary();
  const importMutation = useImportLending();

  return (
    <DashboardShell>
      <Head>
        <title>Lending · PayTrack</title>
      </Head>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lending</h1>
          <p className="text-muted-foreground text-sm">
            Track money you&apos;ve lent to or borrowed from people.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportLinkButton href={lendingExportUrl()} label="Export" />
          <ImportFileButton
            label="Import"
            onImport={(data) => importMutation.mutateAsync(data)}
            describeResult={(result) => {
              const r = result as {
                contactsImported: number;
                transactionsImported: number;
              };
              return `Imported ${r.contactsImported} contact(s) and ${r.transactionsImported} transaction(s).`;
            }}
          />
          <Button asChild>
            <Link href="/lending/new">
              <PlusCircle className="size-4" />
              Add contact
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground -mt-2 text-xs">
        Import adds contacts from a PayTrack export file — it never overwrites or removes
        existing data.
      </p>

      {isSummaryLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard
            label="Owed to you"
            value={summary.totalOwedToYou}
            format={formatCurrency}
            icon={ArrowDownLeft}
            trend={{ value: summary.owedTrend, label: "vs 30 days ago" }}
          />
          <MetricCard
            label="You owe"
            value={summary.totalYouOwe}
            format={formatCurrency}
            icon={ArrowUpRight}
            trend={{ value: summary.oweTrend, label: "vs 30 days ago" }}
          />
        </div>
      )}

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
