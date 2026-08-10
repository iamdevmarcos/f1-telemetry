import type {
  Driver,
  DriverComparison,
  Lap,
  SectorComparison,
  TelemetrySample,
} from "@/lib/domain/types";

function delta(
  timeA: number | null,
  timeB: number | null,
): number | null {
  if (timeA === null || timeB === null) {
    return null;
  }
  return Number((timeA - timeB).toFixed(3));
}

function buildSectors(lapA: Lap, lapB: Lap): SectorComparison[] {
  return [
    {
      sector: 1,
      timeA: lapA.sector1Seconds,
      timeB: lapB.sector1Seconds,
      deltaSeconds: delta(lapA.sector1Seconds, lapB.sector1Seconds),
    },
    {
      sector: 2,
      timeA: lapA.sector2Seconds,
      timeB: lapB.sector2Seconds,
      deltaSeconds: delta(lapA.sector2Seconds, lapB.sector2Seconds),
    },
    {
      sector: 3,
      timeA: lapA.sector3Seconds,
      timeB: lapB.sector3Seconds,
      deltaSeconds: delta(lapA.sector3Seconds, lapB.sector3Seconds),
    },
  ];
}

export function buildDriverComparison(input: {
  driverA: Driver;
  driverB: Driver;
  lapNumber: number;
  lapA: Lap;
  lapB: Lap;
  telemetryA: TelemetrySample[];
  telemetryB: TelemetrySample[];
}): DriverComparison {
  return {
    driverA: input.driverA,
    driverB: input.driverB,
    lapNumber: input.lapNumber,
    lapTimeA: input.lapA.lapTimeSeconds,
    lapTimeB: input.lapB.lapTimeSeconds,
    lapTimeDelta: delta(input.lapA.lapTimeSeconds, input.lapB.lapTimeSeconds),
    sectors: buildSectors(input.lapA, input.lapB),
    telemetryA: input.telemetryA,
    telemetryB: input.telemetryB,
  };
}

export function resolveLapWindow(
  dateStart: string | null,
  lapDurationSeconds: number | null,
): { start: string; end: string } | null {
  if (!dateStart || lapDurationSeconds === null || lapDurationSeconds <= 0) {
    return null;
  }

  const startMs = Date.parse(dateStart);
  if (!Number.isFinite(startMs)) {
    return null;
  }

  const endMs = startMs + lapDurationSeconds * 1000;
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
  };
}

export function downsampleTelemetry(
  samples: TelemetrySample[],
  maxPoints = 280,
): TelemetrySample[] {
  if (samples.length <= maxPoints) {
    return samples;
  }

  const step = Math.ceil(samples.length / maxPoints);
  const downsampled = samples.filter((_, index) => index % step === 0);
  const last = samples[samples.length - 1];

  if (last && downsampled[downsampled.length - 1] !== last) {
    downsampled.push(last);
  }

  return downsampled;
}
