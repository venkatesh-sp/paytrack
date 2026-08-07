import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { addLendingTransactionSchema } from "@/lib/validations/lending";
import { addLendingTransaction } from "@/server/services/lending";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const id = req.query.id;
  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const input = addLendingTransactionSchema.parse(req.body);
    const result = await addLendingTransaction(session.user.id, id, input);
    res.status(201).json(result);
  } catch (error) {
    respondWithError(res, error);
  }
});
