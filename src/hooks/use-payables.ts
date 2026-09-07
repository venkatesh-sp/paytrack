import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManualPayableRequest,
  deletePayableRequest,
  fetchPayable,
  fetchPayables,
  fetchPaymentHistory,
  generatePayablesRequest,
  recordPaymentRequest,
  updatePayableRequest,
} from "@/lib/api/payables";
import type {
  CreateManualPayableInput,
  UpdatePayableInput,
} from "@/lib/validations/payable";
import type { RecordPaymentInput } from "@/lib/validations/payment";
import type { PaymentHistoryFilters } from "@/lib/api/payables";

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["payables"] });
  queryClient.invalidateQueries({ queryKey: ["payment-history"] });
  queryClient.invalidateQueries({ queryKey: ["tracking-items"] });
  queryClient.invalidateQueries({ queryKey: ["tracking-item"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
}

export function usePayables(
  filters?: {
    status?: string;
    month?: string;
    category?: string;
    trackingItemId?: string;
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["payables", filters ?? {}],
    queryFn: () => fetchPayables(filters),
    select: (data) => data.payables,
    enabled: options?.enabled ?? true,
  });
}

export function usePayable(id: string | undefined) {
  return useQuery({
    queryKey: ["payable", id],
    queryFn: () => fetchPayable(id as string),
    select: (data) => data.payable,
    enabled: !!id,
  });
}

export function usePaymentHistory(
  filters?: PaymentHistoryFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["payment-history", filters ?? {}],
    queryFn: () => fetchPaymentHistory(filters),
    select: (data) => data.history,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateManualPayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateManualPayableInput) => createManualPayableRequest(input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdatePayable(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePayableInput) => updatePayableRequest(id, input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeletePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePayableRequest(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useGeneratePayables() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (month?: string) => generatePayablesRequest(month),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useRecordPayment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordPaymentRequest(id, input),
    onSuccess: () => invalidateAll(queryClient),
  });
}
