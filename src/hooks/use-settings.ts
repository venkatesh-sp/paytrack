import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotificationPreferences,
  fetchReminders,
  updateNotificationPreferencesRequest,
} from "@/lib/api/settings";
import type { UpdateNotificationPreferencesInput } from "@/lib/validations/notification-preferences";

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: fetchNotificationPreferences,
    select: (data) => data.preferences,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNotificationPreferencesInput) =>
      updateNotificationPreferencesRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}

export function useReminders() {
  return useQuery({
    queryKey: ["reminders"],
    queryFn: fetchReminders,
    select: (data) => data.reminders,
  });
}
