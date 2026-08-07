import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { deleteLendingTransaction } from "@/server/services/lending";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id, transactionId } = req.query;
  if (typeof id !== "string" || typeof transactionId !== "string") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const contact = await deleteLendingTransaction(session.user.id, id, transactionId);
    res.status(200).json({ contact });
  } catch (error) {
    respondWithError(res, error);
  }
});
