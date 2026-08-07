import { pgEnum } from "drizzle-orm/pg-core";

export const trackingItemTypeEnum = pgEnum("tracking_item_type", [
  "home_loan",
  "personal_loan",
  "car_loan",
  "bike_loan",
  "credit_card_emi",
]);

export const trackingItemStatusEnum = pgEnum("tracking_item_status", [
  "active",
  "completed",
  "closed",
]);

export const payableSourceEnum = pgEnum("payable_source", [
  "tracking_item",
  "manual",
]);

export const payableCategoryEnum = pgEnum("payable_category", [
  "emi",
  "credit_card_bill",
  "borrowed_amount",
  "friend_loan",
  "electricity_bill",
  "internet_bill",
  "water_bill",
  "insurance",
  "rent",
  "miscellaneous",
]);

export const payableStatusEnum = pgEnum("payable_status", [
  "pending",
  "paid",
  "overdue",
]);

export const reminderTypeEnum = pgEnum("reminder_type", [
  "seven_days_before",
  "three_days_before",
  "one_day_before",
  "due_date",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "browser",
  "push",
  "whatsapp",
  "sms",
]);

export const reminderStatusEnum = pgEnum("reminder_status", [
  "sent",
  "failed",
]);
