import { CheckCircle2, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function PaidVsPendingBar({ paid, pending }: { paid: number; pending: number }) {
  const total = paid + pending;
  const paidPct = total > 0 ? (paid / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="bg-muted flex h-3 overflow-hidden rounded-full">
        {total > 0 && (
          <>
            <div className="bg-success h-full" style={{ width: `${paidPct}%` }} />
            <div className="bg-warning h-full" style={{ width: `${100 - paidPct}%` }} />
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-success size-4" />
          <div>
            <p className="text-muted-foreground text-xs">Paid</p>
            <p className="text-sm font-medium">{formatCurrency(paid)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="text-warning size-4" />
          <div>
            <p className="text-muted-foreground text-xs">Pending</p>
            <p className="text-sm font-medium">{formatCurrency(pending)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
