import "server-only";

import type {
  OpenF1CarData,
  OpenF1Driver,
  OpenF1Lap,
  OpenF1Location,
  OpenF1Session,
} from "@/lib/infrastructure/openf1/types";

const DEFAULT_BASE_URL = "https://api.openf1.org/v1";
const REVALIDATE_SECONDS = 60 * 60;

export class OpenF1Error extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OpenF1Error";
  }
}

function getBaseUrl(): string {
  return process.env.OPENF1_BASE_URL?.replace(/\/$/, "") || DEFAULT_BASE_URL;
}

async function openF1Fetch<T>(path: string): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(url, {
        next: { revalidate: REVALIDATE_SECONDS },
        headers: {
          Accept: "application/json",
        },
      });
    } catch {
      if (attempt === maxAttempts) {
        throw new OpenF1Error("OpenF1 is unavailable");
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      continue;
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maxAttempts) {
      throw new OpenF1Error("OpenF1 request failed", response.status);
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
  }

  throw new OpenF1Error("OpenF1 request failed");
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function fetchSessionsByYear(
  year: number,
): Promise<OpenF1Session[]> {
  return openF1Fetch<OpenF1Session[]>(
    `/sessions${toQuery({ year })}`,
  );
}

export async function fetchSession(
  sessionKey: number,
): Promise<OpenF1Session | null> {
  const sessions = await openF1Fetch<OpenF1Session[]>(
    `/sessions${toQuery({ session_key: sessionKey })}`,
  );
  return sessions[0] ?? null;
}

export async function fetchDrivers(
  sessionKey: number,
): Promise<OpenF1Driver[]> {
  return openF1Fetch<OpenF1Driver[]>(
    `/drivers${toQuery({ session_key: sessionKey })}`,
  );
}

export async function fetchLaps(
  sessionKey: number,
  driverNumber: number,
): Promise<OpenF1Lap[]> {
  return openF1Fetch<OpenF1Lap[]>(
    `/laps${toQuery({
      session_key: sessionKey,
      driver_number: driverNumber,
    })}`,
  );
}

export async function fetchLap(
  sessionKey: number,
  driverNumber: number,
  lapNumber: number,
): Promise<OpenF1Lap | null> {
  const laps = await openF1Fetch<OpenF1Lap[]>(
    `/laps${toQuery({
      session_key: sessionKey,
      driver_number: driverNumber,
      lap_number: lapNumber,
    })}`,
  );
  return laps[0] ?? null;
}

export async function fetchCarDataForWindow(
  sessionKey: number,
  driverNumber: number,
  dateStartIso: string,
  dateEndIso: string,
): Promise<OpenF1CarData[]> {
  const path =
    `/car_data?session_key=${sessionKey}` +
    `&driver_number=${driverNumber}` +
    `&date>=${encodeURIComponent(dateStartIso)}` +
    `&date<=${encodeURIComponent(dateEndIso)}`;

  return openF1Fetch<OpenF1CarData[]>(path);
}

export async function fetchLocationForWindow(
  sessionKey: number,
  driverNumber: number,
  dateStartIso: string,
  dateEndIso: string,
): Promise<OpenF1Location[]> {
  const path =
    `/location?session_key=${sessionKey}` +
    `&driver_number=${driverNumber}` +
    `&date>=${encodeURIComponent(dateStartIso)}` +
    `&date<=${encodeURIComponent(dateEndIso)}`;

  return openF1Fetch<OpenF1Location[]>(path);
}
