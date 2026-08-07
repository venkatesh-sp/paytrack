import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTrackingItemRequest,
  deleteTrackingItemRequest,
  fetchTrackingItem,
  fetchTrackingItems,
  updateTrackingItemRequest,
} from "@/lib/api/tracking-items";
import type {
  CreateTrackingItemInput,
  UpdateTrackingItemInput,
} from "@/lib/validations/tracking-item";

const trackingItemsKey = (filters?: { status?: string; type?: string }) =>
  ["tracking-items", filters ?? {}] as const;

export function useTrackingItems(filters?: { status?: string; type?: string }) {
  return useQuery({
    queryKey: trackingItemsKey(filters),
    queryFn: () => fetchTrackingItems(filters),
    select: (data) => data.items,
  });
}

export function useTrackingItem(id: string | undefined) {
  return useQuery({
    queryKey: ["tracking-item", id],
    queryFn: () => fetchTrackingItem(id as string),
    select: (data) => data.item,
    enabled: !!id,
  });
}

export function useCreateTrackingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTrackingItemInput) => createTrackingItemRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking-items"] });
    },
  });
}

export function useUpdateTrackingItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTrackingItemInput) => updateTrackingItemRequest(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking-items"] });
      queryClient.invalidateQueries({ queryKey: ["tracking-item", id] });
    },
  });
}

export function useDeleteTrackingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrackingItemRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking-items"] });
    },
  });
}
