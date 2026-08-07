import { z } from "zod";

export const lendingTransactionTypeValues = ["you_gave", "you_got"] as const;

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
  .refine((v) => Number(v) > 0, "Must be greater than 0");

export const createLendingContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{6,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateLendingContactInput = z.infer<typeof createLendingContactSchema>;

export const updateLendingContactSchema = createLendingContactSchema.partial();

export type UpdateLendingContactInput = z.infer<typeof updateLendingContactSchema>;

export const addLendingTransactionSchema = z.object({
  type: z.enum(lendingTransactionTypeValues),
  amount: moneyString,
  transactionDate: z.string().min(1, "Date is required"),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type AddLendingTransactionInput = z.infer<typeof addLendingTransactionSchema>;
