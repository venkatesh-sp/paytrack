import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { listPaymentHistory } from "@/server/services/payments";
import { toCsv } from "@/lib/csv";
import { payableCategoryLabels } from "@/lib/format";

export default withApiAuth(async (req, res, session) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { year, month, type, trackingItemId } = req.query;
    const history = await listPaymentHistory(session.user.id, {
      year: typeof year === "string" ? Number(year) : undefined,
      month: typeof month === "string" ? month : undefined,
      type: typeof type === "string" ? type : undefined,
      trackingItemId: typeof trackingItemId === "string" ? trackingItemId : undefined,
    });

    const csv = toCsv(
      [
        "Payable",
        "Category",
        "Payment Date",
        "Amount",
        "Payment Method",
        "Outstanding After",
        "Notes",
      ],
      history.map((entry) => [
        entry.payableTitle,
        payableCategoryLabels[entry.payableCategory] ?? entry.payableCategory,
        entry.paymentDate,
        entry.amount,
        entry.paymentMethod ?? "",
        entry.outstandingAfter ?? "",
        entry.notes ?? "",
      ]),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payment-history-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.status(200).send(csv);
  } catch (error) {
    respondWithError(res, error);
  }
});
