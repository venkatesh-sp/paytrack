import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importLending, importTrackingItems } from "@/lib/api/data-transfer";

export function useImportTrackingItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => importTrackingItems(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking-items"] });
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useImportLending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => importLending(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lending-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["lending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
