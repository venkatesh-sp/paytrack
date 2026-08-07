import type { PaymentHistoryEntry } from "@/server/services/payments";
import { formatCurrency, formatDate, payableCategoryLabels } from "@/lib/format";

export async function downloadPaymentHistoryPdf(
  history: PaymentHistoryEntry[],
  subtitle: string,
) {
  const [{ default: jsPDF }, autoTable] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable").then((m) => m.default),
  ]);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("PayTrack — Payment History", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(subtitle, 14, 25);

  autoTable(doc, {
    startY: 32,
    head: [["Payable", "Category", "Date", "Amount", "Method"]],
    body: history.map((entry) => [
      entry.payableTitle,
      payableCategoryLabels[entry.payableCategory] ?? entry.payableCategory,
      formatDate(entry.paymentDate),
      formatCurrency(entry.amount),
      entry.paymentMethod ?? "—",
    ]),
    headStyles: { fillColor: [42, 120, 214] },
    styles: { fontSize: 9 },
  });

  doc.save(`payment-history-${new Date().toISOString().slice(0, 10)}.pdf`);
}
