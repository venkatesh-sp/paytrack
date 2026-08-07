import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { monthlyPayable } from "./payables";
import {
  notificationChannelEnum,
  reminderStatusEnum,
  reminderTypeEnum,
} from "./enums";

export const notificationPreference = pgTable(
  "notification_preference",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    emailEnabled: boolean("email_enabled").notNull().default(true),
    browserEnabled: boolean("browser_enabled").notNull().default(false),
    pushEnabled: boolean("push_enabled").notNull().default(false),
    whatsappEnabled: boolean("whatsapp_enabled").notNull().default(false),
    smsEnabled: boolean("sms_enabled").notNull().default(false),
    remindSevenDaysBefore: boolean("remind_seven_days_before")
      .notNull()
      .default(true),
    remindThreeDaysBefore: boolean("remind_three_days_before")
      .notNull()
      .default(true),
    remindOneDayBefore: boolean("remind_one_day_before")
      .notNull()
      .default(true),
    remindOnDueDate: boolean("remind_on_due_date").notNull().default(true),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("notification_preference_user_idx").on(table.userId)],
);

/**
 * Idempotency ledger for reminder delivery. The unique index is the dedupe key
 * background jobs rely on so a reminder is never sent twice for the same payable.
 */
export const reminderLog = pgTable(
  "reminder_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    monthlyPayableId: uuid("monthly_payable_id")
      .notNull()
      .references(() => monthlyPayable.id, { onDelete: "cascade" }),
    reminderType: reminderTypeEnum("reminder_type").notNull(),
    channel: notificationChannelEnum("channel").notNull().default("email"),
    status: reminderStatusEnum("status").notNull().default("sent"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (table) => [
    index("reminder_log_user_idx").on(table.userId),
    uniqueIndex("reminder_log_dedupe_uidx").on(
      table.monthlyPayableId,
      table.reminderType,
      table.channel,
    ),
  ],
);

export type NotificationPreference = typeof notificationPreference.$inferSelect;
export type NewNotificationPreference = typeof notificationPreference.$inferInsert;
export type ReminderLog = typeof reminderLog.$inferSelect;
export type NewReminderLog = typeof reminderLog.$inferInsert;
