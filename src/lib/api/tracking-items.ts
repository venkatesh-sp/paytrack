import { apiFetch } from "@/lib/api/client";
import type {
  CreateTrackingItemInput,
  UpdateTrackingItemInput,
} from "@/lib/validations/tracking-item";
import type { TrackingItem } from "@/db/schema";

export function fetchTrackingItems(filters?: { status?: string; type?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.type) params.set("type", filters.type);
  const qs = params.toString();
  return apiFetch<{ items: TrackingItem[] }>(
    `/api/tracking-items${qs ? `?${qs}` : ""}`,
  );
}

export function fetchTrackingItem(id: string) {
  return apiFetch<{ item: TrackingItem }>(`/api/tracking-items/${id}`);
}

export function createTrackingItemRequest(input: CreateTrackingItemInput) {
  return apiFetch<{ item: TrackingItem }>("/api/tracking-items", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTrackingItemRequest(id: string, input: UpdateTrackingItemInput) {
  return apiFetch<{ item: TrackingItem }>(`/api/tracking-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTrackingItemRequest(id: string) {
  return apiFetch<void>(`/api/tracking-items/${id}`, { method: "DELETE" });
}
