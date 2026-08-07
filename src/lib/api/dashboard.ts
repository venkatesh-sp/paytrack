import { apiFetch } from "@/lib/api/client";
import type { getDashboardMetrics } from "@/server/services/dashboard";

export type DashboardMetrics = Awaited<ReturnType<typeof getDashboardMetrics>>;

export function fetchDashboardMetrics() {
  return apiFetch<DashboardMetrics>("/api/dashboard/metrics");
}
