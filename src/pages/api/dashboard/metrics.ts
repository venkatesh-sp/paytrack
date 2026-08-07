import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { getDashboardMetrics } from "@/server/services/dashboard";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const metrics = await getDashboardMetrics(session.user.id);
    res.status(200).json(metrics);
  } catch (error) {
    respondWithError(res, error);
  }
});
