import type { TelemetrySample } from "@/lib/domain/types";

export type TelemetryMetric = "speed" | "throttle" | "brake" | "gear";

export type SynchronizedSeriesPoint = {
  t: number;
  a?: number;
  b?: number;
};

const DEFAULT_MAX_POINTS = 400;
const MIN_GRID_STEP_SECONDS = 0.05;

function downsample(samples: TelemetrySample[], maxPoints: number): TelemetrySample[] {
  if (samples.length <= maxPoints) {
    return samples;
  }

  const step = Math.ceil(samples.length / maxPoints);
  return samples.filter((_, index) => index % step === 0);
}

function sampleValue(
  samples: TelemetrySample[],
  metric: TelemetryMetric,
  time: number,
): number | undefined {
  if (samples.length === 0) {
    return undefined;
  }

  const first = samples[0]!;
  const last = samples[samples.length - 1]!;

  if (time < first.relativeTimeSeconds || time > last.relativeTimeSeconds) {
    return undefined;
  }

  let index = 0;
  while (
    index < samples.length - 1 &&
    samples[index + 1]!.relativeTimeSeconds < time
  ) {
    index += 1;
  }

  const left = samples[index]!;
  const right = samples[index + 1];

  if (!right) {
    return left[metric];
  }

  if (metric === "gear") {
    const distanceToLeft = Math.abs(time - left.relativeTimeSeconds);
    const distanceToRight = Math.abs(right.relativeTimeSeconds - time);
    return distanceToLeft <= distanceToRight ? left.gear : right.gear;
  }

  const span = right.relativeTimeSeconds - left.relativeTimeSeconds;
  if (span <= 0) {
    return left[metric];
  }

  const ratio = (time - left.relativeTimeSeconds) / span;
  return left[metric] + ratio * (right[metric] - left[metric]);
}

export function buildSynchronizedSeries(
  telemetryA: TelemetrySample[],
  telemetryB: TelemetrySample[],
  metric: TelemetryMetric,
  maxPoints = DEFAULT_MAX_POINTS,
): SynchronizedSeriesPoint[] {
  const seriesA = downsample(telemetryA, maxPoints);
  const seriesB = downsample(telemetryB, maxPoints);
  const maxTime = Math.max(
    seriesA[seriesA.length - 1]?.relativeTimeSeconds ?? 0,
    seriesB[seriesB.length - 1]?.relativeTimeSeconds ?? 0,
  );

  if (maxTime <= 0) {
    return [];
  }

  const step = Math.max(MIN_GRID_STEP_SECONDS, maxTime / maxPoints);
  const points: SynchronizedSeriesPoint[] = [];

  for (let time = 0; time <= maxTime; time += step) {
    const rounded = Number(time.toFixed(2));
    points.push({
      t: rounded,
      a: sampleValue(seriesA, metric, rounded),
      b: sampleValue(seriesB, metric, rounded),
    });
  }

  const lastPoint = points[points.length - 1];
  if (!lastPoint || lastPoint.t < maxTime) {
    const rounded = Number(maxTime.toFixed(2));
    points.push({
      t: rounded,
      a: sampleValue(seriesA, metric, rounded),
      b: sampleValue(seriesB, metric, rounded),
    });
  }

  return points;
}
