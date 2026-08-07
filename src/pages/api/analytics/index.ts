import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { analyticsFiltersSchema } from "@/lib/validations/analytics";
import { getAnalytics } from "@/server/services/analytics";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { year, month, type } = req.query;
    const filters = analyticsFiltersSchema.parse({
      year: typeof year === "string" ? year : undefined,
      month: typeof month === "string" ? month : undefined,
      type: typeof type === "string" ? type : undefined,
    });
    const analytics = await getAnalytics(session.user.id, filters);
    res.status(200).json(analytics);
  } catch (error) {
    respondWithError(res, error);
  }
});
