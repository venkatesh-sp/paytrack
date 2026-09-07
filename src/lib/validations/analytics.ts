import { z } from "zod";
import { trackingItemTypeValues } from "@/lib/validations/tracking-item";

export const analyticsFiltersSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format")
    .optional(),
  type: z.enum(trackingItemTypeValues).optional(),
  // Accepts either a repeated query param (parsed by Next as string[]) or a
  // single comma-separated string.
  trackingItemIds: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const ids = Array.isArray(value) ? value : value.split(",");
      const cleaned = ids.map((id) => id.trim()).filter(Boolean);
      return cleaned.length > 0 ? cleaned : undefined;
    }),
});

export type AnalyticsFilters = z.infer<typeof analyticsFiltersSchema>;
