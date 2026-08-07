import { z } from "zod";
import { trackingItemTypeValues } from "@/lib/validations/tracking-item";

export const analyticsFiltersSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format")
    .optional(),
  type: z.enum(trackingItemTypeValues).optional(),
});

export type AnalyticsFilters = z.infer<typeof analyticsFiltersSchema>;
