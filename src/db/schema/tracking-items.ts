import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { trackingItemStatusEnum, trackingItemTypeEnum } from "./enums";

export const trackingItem = pgTable(
  "tracking_item",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: trackingItemTypeEnum("type").notNull(),
    status: trackingItemStatusEnum("status").notNull().default("active"),
    lenderName: text("lender_name"),
    accountNumberLast4: text("account_number_last4"),
    principalAmount: numeric("principal_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    interestRate: numeric("interest_rate", { precision: 6, scale: 3 }),
    monthlyEmiAmount: numeric("monthly_emi_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    outstandingAmount: numeric("outstanding_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    tenureMonths: integer("tenure_months").notNull(),
    emiDay: integer("emi_day").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tracking_item_user_idx").on(table.userId),
    index("tracking_item_user_status_idx").on(table.userId, table.status),
    index("tracking_item_user_type_idx").on(table.userId, table.type),
  ],
);

export type TrackingItem = typeof trackingItem.$inferSelect;
export type NewTrackingItem = typeof trackingItem.$inferInsert;
