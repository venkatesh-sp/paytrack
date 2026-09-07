import { z } from "zod";

export const trackingItemTypeValues = [
  "home_loan",
  "personal_loan",
  "car_loan",
  "bike_loan",
  "credit_card_emi",
] as const;

export const trackingItemStatusValues = ["active", "completed", "closed"] as const;

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
  .refine((v) => Number(v) > 0, "Must be greater than 0");

const nonNegativeMoneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
  .refine((v) => Number(v) >= 0, "Cannot be negative");

const rateString = z
  .string()
  .trim()
  .regex(/^\d*(\.\d{1,3})?$/, "Enter a valid rate")
  .optional()
  .or(z.literal(""));

const intString = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number`)
    .refine((v) => Number(v) >= min && Number(v) <= max, {
      message: `${label} must be between ${min} and ${max}`,
    });

export const createTrackingItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  type: z.enum(trackingItemTypeValues),
  lenderName: z.string().trim().max(120).optional().or(z.literal("")),
  accountNumberLast4: z
    .string()
    .trim()
    .regex(/^\d{2,4}$/, "Enter the last 2-4 digits")
    .optional()
    .or(z.literal("")),
  principalAmount: moneyString,
  interestRate: rateString,
  monthlyEmiAmount: moneyString,
  tenureMonths: intString(1, 600, "Tenure"),
  emiDay: intString(1, 31, "EMI day"),
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  outstandingAmount: nonNegativeMoneyString.optional(),
  paidBillingPeriods: z.array(z.string().regex(/^\d{4}-\d{2}$/)).optional(),
});

export type CreateTrackingItemInput = z.infer<typeof createTrackingItemSchema>;

export const updateTrackingItemSchema = createTrackingItemSchema.partial().extend({
  status: z.enum(trackingItemStatusValues).optional(),
  outstandingAmount: nonNegativeMoneyString.optional(),
});

export type UpdateTrackingItemInput = z.infer<typeof updateTrackingItemSchema>;
