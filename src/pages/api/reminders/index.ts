import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { listReminderLog } from "@/server/services/reminders";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const reminders = await listReminderLog(session.user.id);
    res.status(200).json({ reminders });
  } catch (error) {
    respondWithError(res, error);
  }
});
