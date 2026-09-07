import { apiFetch } from "@/lib/api/client";
import type {
  CreateManualPayableInput,
  UpdatePayableInput,
} from "@/lib/validations/payable";
import type { RecordPaymentInput } from "@/lib/validations/payment";
import type { MonthlyPayable, PaymentHistory, TrackingItem } from "@/db/schema";
import type { PaymentHistoryEntry } from "@/server/services/payments";

export function fetchPayables(filters?: {
  status?: string;
  month?: string;
  category?: string;
  trackingItemId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.month) params.set("month", filters.month);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.trackingItemId) params.set("trackingItemId", filters.trackingItemId);
  const qs = params.toString();
  return apiFetch<{ payables: MonthlyPayable[] }>(`/api/payables${qs ? `?${qs}` : ""}`);
}

export function fetchPayable(id: string) {
  return apiFetch<{ payable: MonthlyPayable }>(`/api/payables/${id}`);
}

export function createManualPayableRequest(input: CreateManualPayableInput) {
  return apiFetch<{ payable: MonthlyPayable }>("/api/payables", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePayableRequest(id: string, input: UpdatePayableInput) {
  return apiFetch<{ payable: MonthlyPayable }>(`/api/payables/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePayableRequest(id: string) {
  return apiFetch<void>(`/api/payables/${id}`, { method: "DELETE" });
}

export function generatePayablesRequest(month?: string) {
  return apiFetch<{ created: number; skipped: number; period: string }>(
    "/api/payables/generate",
    { method: "POST", body: JSON.stringify({ month }) },
  );
}

export function recordPaymentRequest(id: string, input: RecordPaymentInput) {
  return apiFetch<{
    payment: PaymentHistory;
    payable: MonthlyPayable;
    trackingItem: TrackingItem | null;
  }>(`/api/payables/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type PaymentHistoryFilters = {
  trackingItemId?: string;
  year?: number;
  month?: string;
  type?: string;
};

export function fetchPaymentHistory(filters?: PaymentHistoryFilters) {
  const params = new URLSearchParams();
  if (filters?.trackingItemId) params.set("trackingItemId", filters.trackingItemId);
  if (filters?.year) params.set("year", String(filters.year));
  if (filters?.month) params.set("month", filters.month);
  if (filters?.type) params.set("type", filters.type);
  const qs = params.toString();
  return apiFetch<{ history: PaymentHistoryEntry[] }>(
    `/api/payment-history${qs ? `?${qs}` : ""}`,
  );
}
