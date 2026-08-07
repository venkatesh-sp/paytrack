import Head from "next/head";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { ColorPresetSettings } from "@/components/settings/color-preset-settings";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { withAuth } from "@/lib/with-auth";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <Head>
        <title>Settings · PayTrack</title>
      </Head>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account, notifications, and appearance.
        </p>
      </div>

      <div className="grid max-w-3xl grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Choose how PayTrack looks on this device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ThemeSettings />
            <div>
              <p className="mb-3 text-sm font-medium">Color preset</p>
              <ColorPresetSettings />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification preferences</CardTitle>
            <CardDescription>
              Choose when PayTrack should remind you about a payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change password</CardTitle>
            <CardDescription>Update the password used to sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive text-base">Danger zone</CardTitle>
            <CardDescription>Irreversible account actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountSection />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

export const getServerSideProps = withAuth();
