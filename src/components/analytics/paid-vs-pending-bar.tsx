import { CheckCircle2, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function PaidVsPendingBar({ paid, pending }: { paid: number; pending: number }) {
  const total = paid + pending;
  const paidPct = total > 0 ? (paid / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {total > 0 && (
          <>
            <div className="h-full bg-success" style={{ width: `${paidPct}%` }} />
            <div className="h-full bg-warning" style={{ width: `${100 - paidPct}%` }} />
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-success" />
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-sm font-medium">{formatCurrency(paid)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-warning" />
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-sm font-medium">{formatCurrency(pending)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
