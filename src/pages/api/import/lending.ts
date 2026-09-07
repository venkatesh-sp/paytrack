import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { lendingExportFileSchema } from "@/lib/validations/data-transfer";
import { importLendingData } from "@/server/services/data-transfer";

export const config = {
  api: {
    bodyParser: { sizeLimit: "5mb" },
  },
};

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const file = lendingExportFileSchema.parse(req.body);
    const result = await importLendingData(session.user.id, file);
    res.status(200).json(result);
  } catch (error) {
    respondWithError(res, error);
  }
});
