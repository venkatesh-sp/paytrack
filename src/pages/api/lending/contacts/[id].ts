import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { updateLendingContactSchema } from "@/lib/validations/lending";
import {
  deleteLendingContact,
  getLendingContactById,
  listLendingTransactions,
  updateLendingContact,
} from "@/server/services/lending";

export default withApiAuth(async (req, res, session) => {
  const userId = session.user.id;
  const id = req.query.id;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    if (req.method === "GET") {
      const contact = await getLendingContactById(userId, id);
      const transactions = await listLendingTransactions(userId, id);
      res.status(200).json({ contact, transactions });
      return;
    }

    if (req.method === "PATCH") {
      const input = updateLendingContactSchema.parse(req.body);
      const contact = await updateLendingContact(userId, id, input);
      res.status(200).json({ contact });
      return;
    }

    if (req.method === "DELETE") {
      await deleteLendingContact(userId, id);
      res.status(204).end();
      return;
    }

    res.setHeader("Allow", "GET, PATCH, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    respondWithError(res, error);
  }
});
