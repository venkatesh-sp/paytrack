import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { updateNotificationPreferencesSchema } from "@/lib/validations/notification-preferences";
import {
  getOrCreateNotificationPreferences,
  updateNotificationPreferences,
} from "@/server/services/notification-preferences";

export default withApiAuth(async (req, res, session) => {
  try {
    if (req.method === "GET") {
      const preferences = await getOrCreateNotificationPreferences(session.user.id);
      res.status(200).json({ preferences });
      return;
    }

    if (req.method === "PATCH") {
      const input = updateNotificationPreferencesSchema.parse(req.body);
      const preferences = await updateNotificationPreferences(session.user.id, input);
      res.status(200).json({ preferences });
      return;
    }

    res.setHeader("Allow", "GET, PATCH");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    respondWithError(res, error);
  }
});
