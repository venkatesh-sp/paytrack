import { z } from "zod";

export const updateNotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  remindSevenDaysBefore: z.boolean().optional(),
  remindThreeDaysBefore: z.boolean().optional(),
  remindOneDayBefore: z.boolean().optional(),
  remindOnDueDate: z.boolean().optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
