import Head from "next/head";
import Link from "next/link";
import { Bell, Mail, Settings as SettingsIcon } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useReminders } from "@/hooks/use-settings";
import { formatDate } from "@/lib/format";
import { withAuth } from "@/lib/with-auth";

const reminderTypeLabels: Record<string, string> = {
  seven_days_before: "7 days before",
  three_days_before: "3 days before",
  one_day_before: "1 day before",
  due_date: "Due date",
};

export default function NotificationsPage() {
  const { data: reminders, isLoading, isError } = useReminders();

  return (
    <DashboardShell>
      <Head>
        <title>Notifications · PayTrack</title>
      </Head>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            A history of reminders PayTrack has sent you.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/settings">
            <SettingsIcon className="size-4" />
            Notification settings
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Bell}
          title="Couldn't load notifications"
          description="Something went wrong loading your data. Try refreshing the page."
        />
      )}

      {!isLoading && !isError && reminders && reminders.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No reminders sent yet"
          description="Once a payment is coming up, reminders will show up here based on your notification preferences."
          action={
            <Button variant="outline" asChild className="mt-2">
              <Link href="/settings">
                <SettingsIcon className="size-4" />
                Configure reminders
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading && !isError && reminders && reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{reminder.payableTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {reminderTypeLabels[reminder.reminderType]} · {formatDate(reminder.sentAt)}
                  </p>
                </div>
              </div>
              <Badge variant={reminder.status === "sent" ? "outline" : "destructive"}>
                {reminder.status === "sent" ? "Sent" : "Failed"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
