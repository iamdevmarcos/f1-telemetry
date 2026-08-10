import "server-only";

import {
  OPENF1_ERROR_CODES,
  OPENF1_USER_MESSAGES,
  type OpenF1ErrorCode,
} from "@/lib/api/openf1-messages";
import type {
  OpenF1CarData,
  OpenF1Driver,
  OpenF1Lap,
  OpenF1Location,
  OpenF1Session,
} from "@/lib/infrastructure/openf1/types";

const DEFAULT_BASE_URL = "https://api.openf1.org/v1";
const REVALIDATE_SECONDS = 60 * 60 * 24;
const MAX_ATTEMPTS = 5;
const MIN_REQUEST_GAP_MS = 200;
const BASE_BACKOFF_MS = 1000;

export class OpenF1Error extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: OpenF1ErrorCode,
  ) {
    super(message);
    this.name = "OpenF1Error";
  }
}

let requestQueue: Promise<void> = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scheduleRequest<T>(task: () => Promise<T>): Promise<T> {
  const run = requestQueue.then(async () => {
    await sleep(MIN_REQUEST_GAP_MS);
    return task();
  });

  requestQueue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

function getBaseUrl(): string {
  return process.env.OPENF1_BASE_URL?.replace(/\/$/, "") || DEFAULT_BASE_URL;
}

function parseRetryAfterMs(response: Response): number {
  const header = response.headers.get("retry-after");
  if (!header) {
    return 0;
  }

  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const retryAt = Date.parse(header);
  if (Number.isFinite(retryAt)) {
    return Math.max(0, retryAt - Date.now());
  }

  return 0;
}

function backoffMs(attempt: number, retryAfterMs: number): number {
  const exponential = BASE_BACKOFF_MS * 2 ** (attempt - 1);
  return Math.max(exponential, retryAfterMs, MIN_REQUEST_GAP_MS);
}

function errorForStatus(status: number): OpenF1Error {
  if (status === 429) {
    return new OpenF1Error(
      OPENF1_USER_MESSAGES.rateLimit.message,
      429,
      OPENF1_ERROR_CODES.RATE_LIMIT,
    );
  }

  return new OpenF1Error(
    OPENF1_USER_MESSAGES.unavailable.message,
    status,
    OPENF1_ERROR_CODES.UNAVAILABLE,
  );
}

async function openF1Fetch<T>(path: string): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await scheduleRequest(() =>
        fetch(url, {
          next: { revalidate: REVALIDATE_SECONDS },
          headers: {
            Accept: "application/json",
          },
        }),
      );

      if (response.ok) {
        return (await response.json()) as T;
      }

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw errorForStatus(response.status);
      }

      await sleep(backoffMs(attempt, parseRetryAfterMs(response)));
    } catch (error) {
      if (error instanceof OpenF1Error) {
        if (error.status === 429 && attempt < MAX_ATTEMPTS) {
          await sleep(backoffMs(attempt, 0));
          continue;
        }
        throw error;
      }

      if (attempt === MAX_ATTEMPTS) {
        throw new OpenF1Error(
          OPENF1_USER_MESSAGES.unavailable.message,
          502,
          OPENF1_ERROR_CODES.UNAVAILABLE,
        );
      }

      await sleep(backoffMs(attempt, 0));
    }
  }

  throw new OpenF1Error(
    OPENF1_USER_MESSAGES.unavailable.message,
    502,
    OPENF1_ERROR_CODES.UNAVAILABLE,
  );
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
