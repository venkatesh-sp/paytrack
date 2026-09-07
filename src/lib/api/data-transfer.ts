import { apiFetch } from "@/lib/api/client";

export function trackingItemsExportUrl(): string {
  return "/api/export/tracking-items";
}

export function lendingExportUrl(): string {
  return "/api/export/lending";
}

export function importTrackingItems(
  data: unknown,
): Promise<{ itemsImported: number; payablesImported: number }> {
  return apiFetch("/api/import/tracking-items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function importLending(
  data: unknown,
): Promise<{ contactsImported: number; transactionsImported: number }> {
  return apiFetch("/api/import/lending", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
