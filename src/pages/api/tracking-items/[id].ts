import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { updateTrackingItemSchema } from "@/lib/validations/tracking-item";
import {
  deleteTrackingItem,
  getTrackingItemById,
  updateTrackingItem,
} from "@/server/services/tracking-items";

export default withApiAuth(async (req, res, session) => {
  const userId = session.user.id;
  const id = req.query.id;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    if (req.method === "GET") {
      const item = await getTrackingItemById(userId, id);
      res.status(200).json({ item });
      return;
    }

    if (req.method === "PATCH") {
      const input = updateTrackingItemSchema.parse(req.body);
      const item = await updateTrackingItem(userId, id, input);
      res.status(200).json({ item });
      return;
    }

    if (req.method === "DELETE") {
      await deleteTrackingItem(userId, id);
      res.status(204).end();
      return;
    }

    res.setHeader("Allow", "GET, PATCH, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    respondWithError(res, error);
  }
});
