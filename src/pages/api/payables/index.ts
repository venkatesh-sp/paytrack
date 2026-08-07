import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { createManualPayableSchema } from "@/lib/validations/payable";
import { createManualPayable, listPayables } from "@/server/services/payables";

export default withApiAuth(async (req, res, session) => {
  const userId = session.user.id;

  try {
    if (req.method === "GET") {
      const { status, month, category } = req.query;
      const payables = await listPayables(userId, {
        status: typeof status === "string" ? status : undefined,
        billingPeriod: typeof month === "string" ? month : undefined,
        category: typeof category === "string" ? category : undefined,
      });
      res.status(200).json({ payables });
      return;
    }

    if (req.method === "POST") {
      const input = createManualPayableSchema.parse(req.body);
      const payable = await createManualPayable(userId, input);
      res.status(201).json({ payable });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    respondWithError(res, error);
  }
});
