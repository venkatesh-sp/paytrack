import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadPaymentHistoryPdf } from "@/lib/pdf";
import { fetchPaymentHistory, type PaymentHistoryFilters } from "@/lib/api/payables";

function buildCsvUrl(filters?: PaymentHistoryFilters) {
  const params = new URLSearchParams();
  if (filters?.trackingItemId) params.set("trackingItemId", filters.trackingItemId);
  if (filters?.year) params.set("year", String(filters.year));
  if (filters?.month) params.set("month", filters.month);
  if (filters?.type) params.set("type", filters.type);
  const qs = params.toString();
  return `/api/export/payment-history${qs ? `?${qs}` : ""}`;
}

export function ExportButton({
  filters,
  subtitle = "All payment history",
}: {
  filters?: PaymentHistoryFilters;
  subtitle?: string;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);

  function handleCsvExport() {
    window.location.href = buildCsvUrl(filters);
  }

  async function handlePdfExport() {
    setPdfLoading(true);
    try {
      const { history } = await fetchPaymentHistory(filters);
      if (history.length === 0) {
        toast.info("No payment history to export for this filter");
        return;
      }
      await downloadPaymentHistoryPdf(history, subtitle);
    } catch {
      toast.error("Couldn't generate the PDF export");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={pdfLoading}>
          {pdfLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={handleCsvExport}>
          <FileSpreadsheet className="size-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handlePdfExport}>
          <FileText className="size-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
