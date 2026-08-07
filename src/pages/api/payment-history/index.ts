import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { listPaymentHistory } from "@/server/services/payments";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { trackingItemId, year, month, type } = req.query;
    const history = await listPaymentHistory(session.user.id, {
      trackingItemId: typeof trackingItemId === "string" ? trackingItemId : undefined,
      year: typeof year === "string" ? Number(year) : undefined,
      month: typeof month === "string" ? month : undefined,
      type: typeof type === "string" ? type : undefined,
    });
    res.status(200).json({ history });
  } catch (error) {
    respondWithError(res, error);
  }
});
