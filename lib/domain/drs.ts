import type { DrsStatus } from "@/lib/domain/types";

/**
 * OpenF1 DRS codes (from FastF1 mapping):
 * 0/1 = off · 8 = eligible in activation zone · 10/12/14 = on
 */
export function classifyDrsStatus(value: number | null | undefined): DrsStatus {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "unknown";
  }

  if (value === 0 || value === 1) {
    return "off";
  }
  if (value === 8) {
    return "eligible";
  }
  if (value === 10 || value === 12 || value === 14) {
    return "on";
  }

  return "unknown";
}

export function formatDrsStatus(status: DrsStatus): string {
  switch (status) {
    case "on":
      return "On";
    case "eligible":
      return "Eligible";
    case "off":
      return "Off";
    default:
      return "—";
  }
}
