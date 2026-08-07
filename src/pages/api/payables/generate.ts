import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { generatePayablesSchema } from "@/lib/validations/payable";
import { generateMonthlyPayables } from "@/server/services/payables";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const input = generatePayablesSchema.parse(req.body ?? {});
    const result = await generateMonthlyPayables(session.user.id, input.month);
    res.status(200).json(result);
  } catch (error) {
    respondWithError(res, error);
  }
});
