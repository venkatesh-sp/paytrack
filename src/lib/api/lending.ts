import { apiFetch } from "@/lib/api/client";
import type {
  AddLendingTransactionInput,
  CreateLendingContactInput,
  UpdateLendingContactInput,
} from "@/lib/validations/lending";
import type { LendingContact, LendingTransaction } from "@/db/schema";
import type { LendingSummary } from "@/server/services/lending";

export function fetchLendingContacts() {
  return apiFetch<{ contacts: LendingContact[] }>("/api/lending/contacts");
}

export function fetchLendingSummary() {
  return apiFetch<LendingSummary>("/api/lending/summary");
}

export function fetchLendingContact(id: string) {
  return apiFetch<{ contact: LendingContact; transactions: LendingTransaction[] }>(
    `/api/lending/contacts/${id}`,
  );
}

export function createLendingContactRequest(input: CreateLendingContactInput) {
  return apiFetch<{ contact: LendingContact }>("/api/lending/contacts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateLendingContactRequest(
  id: string,
  input: UpdateLendingContactInput,
) {
  return apiFetch<{ contact: LendingContact }>(`/api/lending/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteLendingContactRequest(id: string) {
  return apiFetch<void>(`/api/lending/contacts/${id}`, { method: "DELETE" });
}

export function addLendingTransactionRequest(
  contactId: string,
  input: AddLendingTransactionInput,
) {
  return apiFetch<{ transaction: LendingTransaction; contact: LendingContact }>(
    `/api/lending/contacts/${contactId}/transactions`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function deleteLendingTransactionRequest(
  contactId: string,
  transactionId: string,
) {
  return apiFetch<{ contact: LendingContact }>(
    `/api/lending/contacts/${contactId}/transactions/${transactionId}`,
    { method: "DELETE" },
  );
}
