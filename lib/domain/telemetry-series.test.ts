import { describe, expect, it } from "vitest";

import { buildSynchronizedSeries } from "@/lib/domain/telemetry-series";
import type { TelemetrySample } from "@/lib/domain/types";

function makeSample(
  relativeTimeSeconds: number,
  speed: number,
): TelemetrySample {
  return {
    timestamp: "2024-01-01T12:00:00.000Z",
    relativeTimeSeconds,
    driverId: "1",
    speed,
    throttle: 100,
    brake: 0,
    gear: 7,
    rpm: 10000,
  };
}

describe("buildSynchronizedSeries", () => {
  it("keeps both drivers continuous on a shared time grid", () => {
    const telemetryA = [
      makeSample(0, 100),
      makeSample(1, 150),
      makeSample(2, 200),
    ];
    const telemetryB = [
      makeSample(0, 110),
      makeSample(1.15, 160),
      makeSample(2.05, 210),
    ];

    const series = buildSynchronizedSeries(telemetryA, telemetryB, "speed", 10);

    const overlapPoints = series.filter((point) => point.t <= 2);
    expect(overlapPoints.length).toBeGreaterThan(1);
    expect(overlapPoints.every((point) => point.a !== undefined)).toBe(true);
    expect(overlapPoints.every((point) => point.b !== undefined)).toBe(true);
    expect(series[0]?.a).toBe(100);
    expect(series[series.length - 1]?.b).toBe(210);
  });

  it("uses nearest gear instead of fractional interpolation", () => {
    const telemetryA = [
      { ...makeSample(0, 100), gear: 3 },
      { ...makeSample(1, 100), gear: 5 },
    ];
    const telemetryB = [
      { ...makeSample(0.4, 100), gear: 4 },
      { ...makeSample(1.4, 100), gear: 6 },
    ];

    const series = buildSynchronizedSeries(telemetryA, telemetryB, "gear", 5);

    expect(series.some((point) => point.a === 3 || point.a === 5)).toBe(true);
    expect(series.every((point) => Number.isInteger(point.a ?? 0))).toBe(true);
    expect(series.every((point) => Number.isInteger(point.b ?? 0))).toBe(true);
  });
});
