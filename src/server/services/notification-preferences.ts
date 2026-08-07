import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPreference, type NotificationPreference } from "@/db/schema";
import type { UpdateNotificationPreferencesInput } from "@/lib/validations/notification-preferences";

export async function getOrCreateNotificationPreferences(
  userId: string,
): Promise<NotificationPreference> {
  const [existing] = await db
    .select()
    .from(notificationPreference)
    .where(eq(notificationPreference.userId, userId));

  if (existing) return existing;

  const [created] = await db
    .insert(notificationPreference)
    .values({ userId })
    .returning();

  return created;
}

export async function updateNotificationPreferences(
  userId: string,
  input: UpdateNotificationPreferencesInput,
): Promise<NotificationPreference> {
  await getOrCreateNotificationPreferences(userId); // ensure a row exists

  const [updated] = await db
    .update(notificationPreference)
    .set(input)
    .where(eq(notificationPreference.userId, userId))
    .returning();

  return updated;
}
