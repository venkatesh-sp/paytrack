import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { updatePayableSchema } from "@/lib/validations/payable";
import { deletePayable, getPayableById, updatePayable } from "@/server/services/payables";

export default withApiAuth(async (req, res, session) => {
  const userId = session.user.id;
  const id = req.query.id;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    if (req.method === "GET") {
      const payable = await getPayableById(userId, id);
      res.status(200).json({ payable });
      return;
    }

    if (req.method === "PATCH") {
      const input = updatePayableSchema.parse(req.body);
      const payable = await updatePayable(userId, id, input);
      res.status(200).json({ payable });
      return;
    }

    if (req.method === "DELETE") {
      await deletePayable(userId, id);
      res.status(204).end();
      return;
    }

    res.setHeader("Allow", "GET, PATCH, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    respondWithError(res, error);
  }
});
