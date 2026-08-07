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
import { lendingTransactionTypeEnum } from "./enums";

/**
 * balance is a cached running total (positive = contact owes the user, negative =
 * user owes the contact) kept in sync transactionally whenever a lendingTransaction
 * is added or removed, the same pattern trackingItem.outstandingAmount uses.
 */
export const lendingContact = pgTable(
  "lending_contact",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    notes: text("notes"),
    balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("lending_contact_user_idx").on(table.userId)],
);

export const lendingTransaction = pgTable(
  "lending_transaction",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => lendingContact.id, { onDelete: "cascade" }),
    type: lendingTransactionTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    transactionDate: date("transaction_date").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("lending_transaction_user_idx").on(table.userId),
    index("lending_transaction_contact_idx").on(table.contactId),
  ],
);

export type LendingContact = typeof lendingContact.$inferSelect;
export type NewLendingContact = typeof lendingContact.$inferInsert;
export type LendingTransaction = typeof lendingTransaction.$inferSelect;
export type NewLendingTransaction = typeof lendingTransaction.$inferInsert;
