import { z } from "zod";
import {
  trackingItemStatusValues,
  trackingItemTypeValues,
} from "@/lib/validations/tracking-item";
import {
  lendingTransactionTypeEnum,
  payableCategoryEnum,
  payableStatusEnum,
} from "@/db/schema";

// Deliberately looser than the create-form validators (moneyString etc.) —
// this is round-tripping our own previously-exported data, where a
// legitimate historical value can be "0.00" (a still-pending payable, a
// settled contact) that the user-facing "must be > 0" rules would reject.
// The goal here is catching a corrupted/foreign file, not enforcing
// business rules a second time.
const moneyLike = z.string().regex(/^\d+(\.\d+)?$/, "Expected a numeric amount");
const dateLike = z.string().min(1, "Expected a date");
const isoTimestamp = z.string().min(1, "Expected a timestamp");

const monthlyPayableExportSchema = z.object({
  category: z.enum(payableCategoryEnum.enumValues),
  title: z.string().min(1),
  amount: moneyLike,
  dueDate: dateLike,
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/),
  status: z.enum(payableStatusEnum.enumValues),
  paidAmount: moneyLike,
  paidAt: isoTimestamp.nullable(),
  notes: z.string().nullable(),
  createdAt: isoTimestamp,
});

const trackingItemExportSchema = z.object({
  name: z.string().min(1),
  type: z.enum(trackingItemTypeValues),
  status: z.enum(trackingItemStatusValues),
  lenderName: z.string().nullable(),
  accountNumberLast4: z.string().nullable(),
  principalAmount: moneyLike,
  interestRate: moneyLike.nullable(),
  monthlyEmiAmount: moneyLike,
  outstandingAmount: moneyLike,
  tenureMonths: z.number().int().positive(),
  emiDay: z.number().int().min(1).max(31),
  startDate: dateLike,
  endDate: dateLike,
  notes: z.string().nullable(),
  createdAt: isoTimestamp,
  monthlyPayables: z.array(monthlyPayableExportSchema),
});

export const trackingItemsExportFileSchema = z.object({
  kind: z.literal("paytrack.tracking-items"),
  version: z.literal(1),
  exportedAt: isoTimestamp,
  trackingItems: z.array(trackingItemExportSchema),
});

export type TrackingItemsExportFile = z.infer<typeof trackingItemsExportFileSchema>;

const lendingTransactionExportSchema = z.object({
  type: z.enum(lendingTransactionTypeEnum.enumValues),
  amount: moneyLike,
  transactionDate: dateLike,
  note: z.string().nullable(),
  createdAt: isoTimestamp,
});

const lendingContactExportSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: isoTimestamp,
  transactions: z.array(lendingTransactionExportSchema),
});

export const lendingExportFileSchema = z.object({
  kind: z.literal("paytrack.lending"),
  version: z.literal(1),
  exportedAt: isoTimestamp,
  contacts: z.array(lendingContactExportSchema),
});

export type LendingExportFile = z.infer<typeof lendingExportFileSchema>;
