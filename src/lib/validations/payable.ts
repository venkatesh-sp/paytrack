import { z } from "zod";

export const manualPayableCategoryValues = [
  "credit_card_bill",
  "borrowed_amount",
  "friend_loan",
  "electricity_bill",
  "internet_bill",
  "water_bill",
  "insurance",
  "rent",
  "miscellaneous",
] as const;

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
  .refine((v) => Number(v) > 0, "Must be greater than 0");

export const createManualPayableSchema = z.object({
  category: z.enum(manualPayableCategoryValues),
  title: z.string().trim().min(1, "Title is required").max(120),
  amount: moneyString,
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateManualPayableInput = z.infer<typeof createManualPayableSchema>;

export const updatePayableSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  amount: moneyString.optional(),
  dueDate: z.string().min(1).optional(),
  category: z.enum(manualPayableCategoryValues).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type UpdatePayableInput = z.infer<typeof updatePayableSchema>;

export const generatePayablesSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format")
    .optional(),
});

export type GeneratePayablesInput = z.infer<typeof generatePayablesSchema>;
