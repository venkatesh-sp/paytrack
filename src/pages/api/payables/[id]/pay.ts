import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { recordPaymentSchema } from "@/lib/validations/payment";
import { recordPayment } from "@/server/services/payments";

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
    const input = recordPaymentSchema.parse(req.body);
    const result = await recordPayment(session.user.id, id, input);
    res.status(200).json(result);
  } catch (error) {
    respondWithError(res, error);
  }
});
