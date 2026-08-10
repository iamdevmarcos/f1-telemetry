import { describe, expect, it } from "vitest";

import {
  computeLapDrivingMetrics,
  metricDelta,
} from "@/lib/domain/analysis/lap-metrics";
import type { TelemetrySample } from "@/lib/domain/types";

function sample(
  speed: number,
  throttle: number,
  brake: number,
): TelemetrySample {
  return {
    timestamp: "2024-01-01T12:00:00.000Z",
    relativeTimeSeconds: 0,
    driverId: "1",
    speed,
    throttle,
    brake,
    gear: 7,
    rpm: 10000,
  };
}

describe("computeLapDrivingMetrics", () => {
  it("aggregates speed, throttle and brake usage", () => {
    const metrics = computeLapDrivingMetrics([
      sample(300, 100, 0),
      sample(280, 80, 50),
      sample(260, 50, 0),
    ]);

    expect(metrics.maxSpeedKph).toBe(300);
    expect(metrics.avgSpeedKph).toBe(280);
    expect(metrics.avgThrottlePercent).toBe(76.7);
    expect(metrics.fullThrottlePercent).toBe(33.3);
    expect(metrics.brakingPercent).toBe(33.3);
  });

  it("returns null metrics for empty telemetry", () => {
    const metrics = computeLapDrivingMetrics([]);

    expect(metrics.maxSpeedKph).toBeNull();
    expect(metrics.avgSpeedKph).toBeNull();
  });
});

describe("metricDelta", () => {
  it("computes A minus B", () => {
    expect(metricDelta(310, 305)).toBe(5);
    expect(metricDelta(null, 305)).toBeNull();
  });
});
