import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { createTrackingItemSchema } from "@/lib/validations/tracking-item";
import { createTrackingItem, listTrackingItems } from "@/server/services/tracking-items";

export default withApiAuth(async (req, res, session) => {
  const userId = session.user.id;

  try {
    if (req.method === "GET") {
      const { status, type } = req.query;
      const items = await listTrackingItems(userId, {
        status: typeof status === "string" ? status : undefined,
        type: typeof type === "string" ? type : undefined,
      });
      res.status(200).json({ items });
      return;
    }

    if (req.method === "POST") {
      const input = createTrackingItemSchema.parse(req.body);
      const item = await createTrackingItem(userId, input);
      res.status(201).json({ item });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    respondWithError(res, error);
  }
});
