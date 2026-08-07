import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addLendingTransactionRequest,
  createLendingContactRequest,
  deleteLendingContactRequest,
  deleteLendingTransactionRequest,
  fetchLendingContact,
  fetchLendingContacts,
  updateLendingContactRequest,
} from "@/lib/api/lending";
import type {
  AddLendingTransactionInput,
  CreateLendingContactInput,
  UpdateLendingContactInput,
} from "@/lib/validations/lending";

function invalidateAll(
  queryClient: ReturnType<typeof useQueryClient>,
  contactId?: string,
) {
  queryClient.invalidateQueries({ queryKey: ["lending-contacts"] });
  if (contactId) {
    queryClient.invalidateQueries({ queryKey: ["lending-contact", contactId] });
  }
  queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
}

export function useLendingContacts() {
  return useQuery({
    queryKey: ["lending-contacts"],
    queryFn: fetchLendingContacts,
    select: (data) => data.contacts,
  });
}

export function useLendingContact(id: string | undefined) {
  return useQuery({
    queryKey: ["lending-contact", id],
    queryFn: () => fetchLendingContact(id as string),
    enabled: !!id,
  });
}

export function useCreateLendingContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLendingContactInput) => createLendingContactRequest(input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateLendingContact(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLendingContactInput) =>
      updateLendingContactRequest(id, input),
    onSuccess: () => invalidateAll(queryClient, id),
  });
}

export function useDeleteLendingContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLendingContactRequest(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useAddLendingTransaction(contactId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddLendingTransactionInput) =>
      addLendingTransactionRequest(contactId, input),
    onSuccess: () => invalidateAll(queryClient, contactId),
  });
}

export function useDeleteLendingTransaction(contactId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) =>
      deleteLendingTransactionRequest(contactId, transactionId),
    onSuccess: () => invalidateAll(queryClient, contactId),
  });
}
