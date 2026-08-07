import { apiFetch } from "@/lib/api/client";
import type { getAnalytics } from "@/server/services/analytics";

export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;

export function fetchAnalytics(filters?: {
  year?: number;
  month?: string;
  type?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.year) params.set("year", String(filters.year));
  if (filters?.month) params.set("month", filters.month);
  if (filters?.type) params.set("type", filters.type);
  const qs = params.toString();
  return apiFetch<AnalyticsData>(`/api/analytics${qs ? `?${qs}` : ""}`);
}
