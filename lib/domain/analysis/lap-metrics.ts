import type { TelemetrySample, LapDrivingMetrics } from "@/lib/domain/types";

export type { LapDrivingMetrics };

const FULL_THROTTLE_THRESHOLD = 99;

export function computeLapDrivingMetrics(
  samples: TelemetrySample[],
): LapDrivingMetrics {
  if (samples.length === 0) {
    return {
      maxSpeedKph: null,
      avgSpeedKph: null,
      avgThrottlePercent: null,
      fullThrottlePercent: null,
      brakingPercent: null,
    };
  }

  let maxSpeed = -Infinity;
  let speedSum = 0;
  let throttleSum = 0;
  let fullThrottleCount = 0;
  let brakingCount = 0;

  for (const sample of samples) {
    maxSpeed = Math.max(maxSpeed, sample.speed);
    speedSum += sample.speed;
    throttleSum += sample.throttle;
    if (sample.throttle >= FULL_THROTTLE_THRESHOLD) {
      fullThrottleCount += 1;
    }
    if (sample.brake > 0) {
      brakingCount += 1;
    }
  }

  const count = samples.length;

  return {
    maxSpeedKph: Number(maxSpeed.toFixed(1)),
    avgSpeedKph: Number((speedSum / count).toFixed(1)),
    avgThrottlePercent: Number((throttleSum / count).toFixed(1)),
    fullThrottlePercent: Number(((fullThrottleCount / count) * 100).toFixed(1)),
    brakingPercent: Number(((brakingCount / count) * 100).toFixed(1)),
  };
}

export function metricDelta(
  valueA: number | null,
  valueB: number | null,
): number | null {
  if (valueA === null || valueB === null) {
    return null;
  }
  return Number((valueA - valueB).toFixed(1));
}
