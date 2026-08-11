import { describe, expect, it } from "vitest";

import {
  buildTrackSectorPaths,
  resolveActiveSector,
} from "@/lib/domain/track-sectors";
import type { Lap } from "@/lib/domain/types";

const lap: Lap = {
  driverId: "1",
  lapNumber: 2,
  lapTimeSeconds: 90,
  sector1Seconds: 30,
  sector2Seconds: 30,
  sector3Seconds: 30,
  dateStart: "2025-01-01T12:00:00.000Z",
};

function makeOutlineLocations(count: number) {
  const start = Date.parse("2025-01-01T12:00:00.000Z");
  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    return {
      date: new Date(start + progress * 90_000).toISOString(),
      x: Math.cos(progress * Math.PI * 2) * 1000,
      y: Math.sin(progress * Math.PI * 2) * 1000,
    };
  });
}

describe("buildTrackSectorPaths", () => {
  it("splits outline by sector times", () => {
    const sectors = buildTrackSectorPaths({
      outlineLocations: makeOutlineLocations(90),
      lap,
    });

    expect(sectors).not.toBeNull();
    expect(sectors).toHaveLength(3);
    expect(sectors![0]!.sector).toBe(1);
    expect(sectors![1]!.sector).toBe(2);
    expect(sectors![2]!.sector).toBe(3);
    expect(sectors!.every((sector) => sector.points.length >= 2)).toBe(true);
  });

  it("falls back to equal thirds without sector times", () => {
    const sectors = buildTrackSectorPaths({
      outlineLocations: makeOutlineLocations(60),
      lap: {
        ...lap,
        sector1Seconds: null,
        sector2Seconds: null,
        sector3Seconds: null,
      },
    });

    expect(sectors).not.toBeNull();
    expect(sectors).toHaveLength(3);
  });

  it("returns null for too few samples", () => {
    expect(
      buildTrackSectorPaths({
        outlineLocations: makeOutlineLocations(8),
        lap,
      }),
    ).toBeNull();
  });
});

describe("resolveActiveSector", () => {
  it("returns the sector for the current elapsed lap time", () => {
    expect(
      resolveActiveSector({
        lap,
        frameTimestamp: "2025-01-01T12:00:15.000Z",
      }),
    ).toBe(1);
    expect(
      resolveActiveSector({
        lap,
        frameTimestamp: "2025-01-01T12:00:45.000Z",
      }),
    ).toBe(2);
    expect(
      resolveActiveSector({
        lap,
        frameTimestamp: "2025-01-01T12:01:20.000Z",
      }),
    ).toBe(3);
  });

  it("returns null without sector timing", () => {
    expect(
      resolveActiveSector({
        lap: { ...lap, sector1Seconds: null },
        frameTimestamp: "2025-01-01T12:00:15.000Z",
      }),
    ).toBeNull();
  });
});
