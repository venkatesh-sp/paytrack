import { sql } from "drizzle-orm";
import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { monthlyPayable } from "./payables";
import { trackingItem } from "./tracking-items";

/**
 * Append-only ledger. Rows here are never updated or deleted — each represents
 * one real-world payment event and is the source of truth for financial history.
 */
export const paymentHistory = pgTable(
  "payment_history",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    monthlyPayableId: uuid("monthly_payable_id")
      .notNull()
      .references(() => monthlyPayable.id, { onDelete: "cascade" }),
    trackingItemId: uuid("tracking_item_id").references(() => trackingItem.id, {
      onDelete: "set null",
    }),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    principalComponent: numeric("principal_component", {
      precision: 14,
      scale: 2,
    }),
    interestComponent: numeric("interest_component", {
      precision: 14,
      scale: 2,
    }),
    outstandingAfter: numeric("outstanding_after", {
      precision: 14,
      scale: 2,
    }),
    paymentDate: date("payment_date").notNull(),
    paymentMethod: text("payment_method"),
    notes: text("notes"),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => [
    index("payment_history_user_date_idx").on(table.userId, table.paymentDate),
    index("payment_history_payable_idx").on(table.monthlyPayableId),
    index("payment_history_tracking_item_idx").on(table.trackingItemId),
  ],
);

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type NewPaymentHistory = typeof paymentHistory.$inferInsert;
