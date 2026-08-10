import type { Lap } from "@/lib/domain/types";

export function intersectLapNumbers(
  lapsA: Lap[],
  lapsB: Lap[],
): number[] {
  const timedB = new Set(
    lapsB
      .filter((lap) => lap.lapTimeSeconds !== null)
      .map((lap) => lap.lapNumber),
  );

  return lapsA
    .filter(
      (lap) =>
        lap.lapTimeSeconds !== null && timedB.has(lap.lapNumber),
    )
    .map((lap) => lap.lapNumber)
    .sort((a, b) => a - b);
}
