import "server-only";

import type { Driver, Lap, Session } from "@/lib/domain/types";
import { isRaceAvailable } from "@/lib/domain/session";
import {
  fetchDrivers,
  fetchLaps,
  fetchSession,
  fetchSessionsByYear,
  OpenF1Error,
} from "@/lib/infrastructure/openf1/client";
import {
  mapDriver,
  mapLap,
  mapSession,
} from "@/lib/infrastructure/openf1/mappers";

const SESSION_START_YEAR = 2023;

function getSessionYears(): number[] {
  const currentYear = new Date().getUTCFullYear();
  const years: number[] = [];

  for (let year = currentYear; year >= SESSION_START_YEAR; year -= 1) {
    years.push(year);
  }

  return years;
}

export async function listSessions(): Promise<Session[]> {
  const results = await Promise.all(
    getSessionYears().map(async (year) => {
      try {
        return await fetchSessionsByYear(year);
      } catch (error) {
        if (error instanceof OpenF1Error) {
          return [];
        }
        throw error;
      }
    }),
  );

  const sessions = results
    .flat()
    .filter((session) => !session.is_cancelled && session.session_name === "Race")
    .map(mapSession)
    .sort((a, b) => Date.parse(b.dateStart) - Date.parse(a.dateStart));

  return sessions;
}

async function requireAvailableRace(sessionId: string): Promise<Session> {
  const sessionKey = Number(sessionId);
  if (!Number.isFinite(sessionKey)) {
    throw new OpenF1Error("Invalid session", 400);
  }

  const rawSession = await fetchSession(sessionKey);
  if (!rawSession) {
    throw new OpenF1Error("Session not found", 404);
  }

  const session = mapSession(rawSession);
  if (!isRaceAvailable(session)) {
    throw new OpenF1Error("Race has not happened yet", 400);
  }

  return session;
}

export async function listDrivers(sessionId: string): Promise<Driver[]> {
  const sessionKey = Number(sessionId);
  if (!Number.isFinite(sessionKey)) {
    throw new OpenF1Error("Invalid session", 400);
  }

  await requireAvailableRace(sessionId);

  const drivers = await fetchDrivers(sessionKey);
  return drivers
    .map(mapDriver)
    .sort((a, b) => a.acronym.localeCompare(b.acronym));
}

export async function listLaps(
  sessionId: string,
  driverId: string,
): Promise<Lap[]> {
  const sessionKey = Number(sessionId);
  const driverNumber = Number(driverId);

  if (!Number.isFinite(sessionKey) || !Number.isFinite(driverNumber)) {
    throw new OpenF1Error("Invalid session or driver", 400);
  }

  await requireAvailableRace(sessionId);

  const laps = await fetchLaps(sessionKey, driverNumber);
  return laps
    .map(mapLap)
    .filter((lap) => lap.lapTimeSeconds !== null)
    .sort((a, b) => a.lapNumber - b.lapNumber);
}
