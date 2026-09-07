import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { getLendingSummary } from "@/server/services/lending";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const summary = await getLendingSummary(session.user.id);
    res.status(200).json(summary);
  } catch (error) {
    respondWithError(res, error);
  }
});
