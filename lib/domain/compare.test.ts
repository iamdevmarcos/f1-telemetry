import { describe, expect, it } from "vitest";

import {
  buildDriverComparison,
  downsampleTelemetry,
  resolveLapWindow,
} from "@/lib/domain/compare";
import type { Driver, Lap, TelemetrySample } from "@/lib/domain/types";

const driverA: Driver = {
  id: "1",
  number: 1,
  acronym: "VER",
  fullName: "Max Verstappen",
  teamName: "Red Bull Racing",
  teamColour: "#3671C6",
};

const driverB: Driver = {
  id: "4",
  number: 4,
  acronym: "NOR",
  fullName: "Lando Norris",
  teamName: "McLaren",
  teamColour: "#FF8000",
};

const lapA: Lap = {
  driverId: "1",
  lapNumber: 12,
  lapTimeSeconds: 91.2,
  sector1Seconds: 28.1,
  sector2Seconds: 36.4,
  sector3Seconds: 26.7,
  dateStart: "2024-01-01T12:00:00.000Z",
};

const lapB: Lap = {
  driverId: "4",
  lapNumber: 12,
  lapTimeSeconds: 91.5,
  sector1Seconds: 28.3,
  sector2Seconds: 36.2,
  sector3Seconds: 27.0,
  dateStart: "2024-01-01T12:01:00.000Z",
};

describe("buildDriverComparison", () => {
  it("calculates lap and sector deltas with A minus B", () => {
    const comparison = buildDriverComparison({
      driverA,
      driverB,
      lapNumber: 12,
      lapA,
      lapB,
      telemetryA: [],
      telemetryB: [],
    });

    expect(comparison.lapTimeDelta).toBe(-0.3);
    expect(comparison.sectors[0]?.deltaSeconds).toBe(-0.2);
    expect(comparison.sectors[1]?.deltaSeconds).toBe(0.2);
    expect(comparison.sectors[2]?.deltaSeconds).toBe(-0.3);
  });
});

describe("resolveLapWindow", () => {
  it("builds an ISO window from lap start and duration", () => {
    const window = resolveLapWindow("2024-01-01T12:00:00.000Z", 90);

    expect(window).toEqual({
      start: "2024-01-01T12:00:00.000Z",
      end: "2024-01-01T12:01:30.000Z",
    });
  });

  it("returns null when timing is incomplete", () => {
    expect(resolveLapWindow(null, 90)).toBeNull();
    expect(resolveLapWindow("2024-01-01T12:00:00.000Z", null)).toBeNull();
  });
});

describe("downsampleTelemetry", () => {
  it("keeps short series intact and preserves the last sample", () => {
    const samples: TelemetrySample[] = Array.from({ length: 10 }, (_, index) => ({
      timestamp: `2024-01-01T12:00:0${index}.000Z`,
      relativeTimeSeconds: index,
      driverId: "1",
      speed: 200 + index,
      throttle: 100,
      brake: 0,
      gear: 7,
      rpm: 10000,
    }));

    expect(downsampleTelemetry(samples, 280)).toHaveLength(10);

    const dense = Array.from({ length: 500 }, (_, index) => ({
      ...samples[0]!,
      relativeTimeSeconds: index,
      speed: index,
    }));
    const result = downsampleTelemetry(dense, 100);
    expect(result.length).toBeLessThanOrEqual(101);
    expect(result[result.length - 1]?.speed).toBe(499);
  });
});
