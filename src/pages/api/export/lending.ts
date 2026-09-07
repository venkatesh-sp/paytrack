import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { exportLendingData } from "@/server/services/data-transfer";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const data = await exportLendingData(session.user.id);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="paytrack-lending-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.status(200).send(JSON.stringify(data, null, 2));
  } catch (error) {
    respondWithError(res, error);
  }
});
