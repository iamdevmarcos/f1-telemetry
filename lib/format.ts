export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return "—";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds - minutes * 60;
  const whole = Math.floor(remaining);
  const millis = Math.round((remaining - whole) * 1000)
    .toString()
    .padStart(3, "0");

  return `${minutes}:${whole.toString().padStart(2, "0")}.${millis}`;
}

export function formatDelta(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return "—";
  }

  const sign = seconds > 0 ? "+" : "";
  return `${sign}${seconds.toFixed(3)}s`;
}

export function formatSector(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return "—";
  }
  return `${seconds.toFixed(3)}s`;
}

export function formatRaceDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

import type { Session } from "@/lib/domain/types";

export function getRacePlaceName(
  session: Pick<Session, "countryName" | "location">,
  sessionsInYear: Array<Pick<Session, "countryName" | "location">>,
): string {
  const sameCountryCount = sessionsInYear.filter(
    (item) => item.countryName === session.countryName,
  ).length;

  if (sameCountryCount > 1 && session.location) {
    return `${session.countryName} · ${session.location}`;
  }

  return session.countryName;
}

export function formatRaceLabel(input: {
  placeName: string;
  dateStart: string;
}): string {
  return `${input.placeName} · ${formatRaceDate(input.dateStart)}`;
}

export function formatSessionRaceLabel(
  session: Session,
  sessions: Session[],
): string {
  const sessionsInYear = sessions.filter((item) => item.year === session.year);

  return formatRaceLabel({
    placeName: getRacePlaceName(session, sessionsInYear),
    dateStart: session.dateStart,
  });
}
