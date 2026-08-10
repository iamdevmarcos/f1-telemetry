import "server-only";

import {
  buildDriverComparison,
  downsampleTelemetry,
  resolveLapWindow,
} from "@/lib/domain/compare";
import type { CompareResult } from "@/lib/domain/types";
import { isRaceAvailable } from "@/lib/domain/session";
import {
  fetchCarDataForWindow,
  fetchDrivers,
  fetchLap,
  fetchSession,
  OpenF1Error,
} from "@/lib/infrastructure/openf1/client";
import {
  mapDriver,
  mapLap,
  mapSession,
  mapTelemetrySamples,
} from "@/lib/infrastructure/openf1/mappers";

export async function compareDrivers(input: {
  sessionId: string;
  driverAId: string;
  driverBId: string;
  lapNumber: number;
}): Promise<CompareResult> {
  const sessionKey = Number(input.sessionId);
  const driverANumber = Number(input.driverAId);
  const driverBNumber = Number(input.driverBId);

  if (
    !Number.isFinite(sessionKey) ||
    !Number.isFinite(driverANumber) ||
    !Number.isFinite(driverBNumber) ||
    !Number.isFinite(input.lapNumber)
  ) {
    throw new OpenF1Error("Invalid compare parameters", 400);
  }

  if (driverANumber === driverBNumber) {
    throw new OpenF1Error("Drivers must be different", 400);
  }

  const [rawSession, rawDrivers, rawLapA, rawLapB] = await Promise.all([
    fetchSession(sessionKey),
    fetchDrivers(sessionKey),
    fetchLap(sessionKey, driverANumber, input.lapNumber),
    fetchLap(sessionKey, driverBNumber, input.lapNumber),
  ]);

  if (!rawSession) {
    throw new OpenF1Error("Session not found", 404);
  }

  const session = mapSession(rawSession);
  if (!isRaceAvailable(session)) {
    throw new OpenF1Error("Race has not happened yet", 400);
  }

  const driverA = rawDrivers.find((d) => d.driver_number === driverANumber);
  const driverB = rawDrivers.find((d) => d.driver_number === driverBNumber);

  if (!driverA || !driverB) {
    throw new OpenF1Error("Driver not found", 404);
  }

  if (!rawLapA) {
    throw new OpenF1Error(
      `Lap ${input.lapNumber} not found for the selected driver`,
      400,
    );
  }

  if (!rawLapB) {
    throw new OpenF1Error(
      `Lap ${input.lapNumber} was not completed by both drivers. Choose a lap both drivers finished.`,
      400,
    );
  }

  const lapA = mapLap(rawLapA);
  const lapB = mapLap(rawLapB);
  const windowA = resolveLapWindow(lapA.dateStart, lapA.lapTimeSeconds);
  const windowB = resolveLapWindow(lapB.dateStart, lapB.lapTimeSeconds);

  if (!windowA || !windowB) {
    throw new OpenF1Error("Lap timing window unavailable", 404);
  }

  const [carDataA, carDataB] = await Promise.all([
    fetchCarDataForWindow(
      sessionKey,
      driverANumber,
      windowA.start,
      windowA.end,
    ),
    fetchCarDataForWindow(
      sessionKey,
      driverBNumber,
      windowB.start,
      windowB.end,
    ),
  ]);

  const telemetryA = downsampleTelemetry(
    mapTelemetrySamples(carDataA, windowA.start),
  );
  const telemetryB = downsampleTelemetry(
    mapTelemetrySamples(carDataB, windowB.start),
  );

  if (telemetryA.length === 0 && telemetryB.length === 0) {
    throw new OpenF1Error("Telemetry unavailable for this lap", 404);
  }

  return {
    session,
    comparison: buildDriverComparison({
      driverA: mapDriver(driverA),
      driverB: mapDriver(driverB),
      lapNumber: input.lapNumber,
      lapA,
      lapB,
      telemetryA,
      telemetryB,
    }),
  };
}
