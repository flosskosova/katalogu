import type { MaintenanceStatus, MaturityLevel } from "@/lib/types";

export function maturityLabel(m: MaturityLevel): string {
  const map: Record<MaturityLevel, string> = {
    experimental: "Experimental",
    growing: "Growing",
    established: "Established",
    "industry-standard": "Industry standard",
  };
  return map[m];
}

export function maintenanceLabel(s: MaintenanceStatus): string {
  const map: Record<MaintenanceStatus, string> = {
    active: "Active",
    slow: "Slower cadence",
    maintenance: "Maintenance mode",
  };
  return map[s];
}
