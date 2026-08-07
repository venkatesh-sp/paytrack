import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { monthlyPayable, reminderLog, type ReminderLog } from "@/db/schema";

export type ReminderLogEntry = ReminderLog & { payableTitle: string };

export async function listReminderLog(
  userId: string,
  limit = 50,
): Promise<ReminderLogEntry[]> {
  const rows = await db
    .select({
      reminder: reminderLog,
      payableTitle: monthlyPayable.title,
    })
    .from(reminderLog)
    .innerJoin(monthlyPayable, eq(reminderLog.monthlyPayableId, monthlyPayable.id))
    .where(eq(reminderLog.userId, userId))
    .orderBy(desc(reminderLog.sentAt))
    .limit(limit);

  return rows.map((row) => ({ ...row.reminder, payableTitle: row.payableTitle }));
}
