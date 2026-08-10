import { describe, expect, it } from "vitest";

import { intersectLapNumbers } from "@/lib/domain/laps";
import type { Lap } from "@/lib/domain/types";

function lap(driverId: string, lapNumber: number, time: number | null): Lap {
  return {
    driverId,
    lapNumber,
    lapTimeSeconds: time,
    sector1Seconds: null,
    sector2Seconds: null,
    sector3Seconds: null,
    dateStart: null,
  };
}

describe("intersectLapNumbers", () => {
  it("returns laps both drivers completed with valid time", () => {
    const lapsA = [lap("1", 1, 90), lap("1", 2, 91), lap("1", 3, 92)];
    const lapsB = [lap("2", 1, 89), lap("2", 3, 93)];

    expect(intersectLapNumbers(lapsA, lapsB)).toEqual([1, 3]);
  });

  it("returns empty when drivers share no timed laps", () => {
    const lapsA = [lap("1", 4, 90)];
    const lapsB = [lap("2", 1, 89)];

    expect(intersectLapNumbers(lapsA, lapsB)).toEqual([]);
  });
});
