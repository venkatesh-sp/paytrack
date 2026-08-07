import { apiFetch } from "@/lib/api/client";
import type { UpdateNotificationPreferencesInput } from "@/lib/validations/notification-preferences";
import type { NotificationPreference } from "@/db/schema";
import type { ReminderLogEntry } from "@/server/services/reminders";

export function fetchNotificationPreferences() {
  return apiFetch<{ preferences: NotificationPreference }>(
    "/api/notification-preferences",
  );
}

export function updateNotificationPreferencesRequest(
  input: UpdateNotificationPreferencesInput,
) {
  return apiFetch<{ preferences: NotificationPreference }>(
    "/api/notification-preferences",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function fetchReminders() {
  return apiFetch<{ reminders: ReminderLogEntry[] }>("/api/reminders");
}
