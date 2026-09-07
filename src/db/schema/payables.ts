import { sql } from "drizzle-orm";
import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { payableCategoryEnum, payableSourceEnum, payableStatusEnum } from "./enums";
import { trackingItem } from "./tracking-items";

export const monthlyPayable = pgTable(
  "monthly_payable",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // "cascade" (not "set null") deliberately: a payable generated for a
    // tracking item has no independent meaning once that item is deleted, so
    // it — and, via their own cascading FKs, its payment_history and
    // reminder_log rows — must go with it. Manual (non-tracking-item)
    // payables are unaffected since their trackingItemId is already null.
    trackingItemId: uuid("tracking_item_id").references(() => trackingItem.id, {
      onDelete: "cascade",
    }),
    source: payableSourceEnum("source").notNull(),
    category: payableCategoryEnum("category").notNull(),
    title: text("title").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    dueDate: date("due_date").notNull(),
    billingPeriod: text("billing_period").notNull(), // "YYYY-MM"
    status: payableStatusEnum("status").notNull().default("pending"),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    paidAt: timestamp("paid_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("monthly_payable_user_due_date_idx").on(table.userId, table.dueDate),
    index("monthly_payable_user_status_idx").on(table.userId, table.status),
    index("monthly_payable_tracking_item_idx").on(table.trackingItemId),
    uniqueIndex("monthly_payable_tracking_item_period_uidx")
      .on(table.trackingItemId, table.billingPeriod)
      .where(sql`${table.trackingItemId} is not null`),
  ],
);

export type MonthlyPayable = typeof monthlyPayable.$inferSelect;
export type NewMonthlyPayable = typeof monthlyPayable.$inferInsert;
