import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics } from "@/lib/api/analytics";

export function useAnalytics(filters?: { year?: number; month?: string; type?: string }) {
  return useQuery({
    queryKey: ["analytics", filters ?? {}],
    queryFn: () => fetchAnalytics(filters),
  });
}
