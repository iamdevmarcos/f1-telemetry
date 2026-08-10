export type ExplorerShareMode = "replay" | "compare";

export type ReplayShareInput = {
  sessionId: string;
  driverId: string;
  driverBId?: string;
};

export type CompareShareInput = {
  sessionId: string;
  driverAId: string;
  driverBId: string;
  lapNumber: string | number;
};

export function buildReplaySharePath(input: ReplayShareInput): string {
  const params = new URLSearchParams({
    session: input.sessionId,
    driver: input.driverId,
  });

  if (input.driverBId) {
    params.set("driverB", input.driverBId);
  }

  return `/?${params.toString()}`;
}

export function buildCompareSharePath(input: CompareShareInput): string {
  const params = new URLSearchParams({
    mode: "compare",
    session: input.sessionId,
    driverA: input.driverAId,
    driverB: input.driverBId,
    lap: String(input.lapNumber),
  });

  return `/?${params.toString()}`;
}

export function parseExplorerShareParams(
  searchParams: URLSearchParams,
): {
  mode: ExplorerShareMode;
  sessionId: string | null;
  driverId: string | null;
  driverBId: string | null;
  driverAId: string | null;
  lapNumber: string | null;
} {
  const mode: ExplorerShareMode =
    searchParams.get("mode") === "compare" ? "compare" : "replay";

  return {
    mode,
    sessionId: searchParams.get("session"),
    driverId: searchParams.get("driver"),
    driverBId: searchParams.get("driverB"),
    driverAId: searchParams.get("driverA"),
    lapNumber: searchParams.get("lap"),
  };
}
