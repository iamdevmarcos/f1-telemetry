import type {
  Driver,
  Lap,
  Session,
  TelemetrySample,
} from "@/lib/domain/types";
import { isRaceUpcoming } from "@/lib/domain/session";
import type {
  OpenF1CarData,
  OpenF1Driver,
  OpenF1Lap,
  OpenF1Session,
} from "@/lib/infrastructure/openf1/types";

function normalizeTeamColour(colour: string | null | undefined): string {
  if (!colour) {
    return "#E10600";
  }

  const cleaned = colour.replace("#", "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return "#E10600";
  }

  return `#${cleaned.toUpperCase()}`;
}

export function mapSession(raw: OpenF1Session): Session {
  const dateStart = raw.date_start;
  const dateEnd = raw.date_end;

  return {
    id: String(raw.session_key),
    year: raw.year,
    countryName: raw.country_name,
    circuitShortName: raw.circuit_short_name,
    location: raw.location,
    sessionName: raw.session_name,
    sessionType: raw.session_type,
    dateStart,
    dateEnd,
    isUpcoming: isRaceUpcoming({ dateStart }),
  };
}

export function mapDriver(raw: OpenF1Driver): Driver {
  return {
    id: String(raw.driver_number),
    number: raw.driver_number,
    acronym: raw.name_acronym,
    fullName: raw.full_name,
    teamName: raw.team_name,
    teamColour: normalizeTeamColour(raw.team_colour),
  };
}

export function mapLap(raw: OpenF1Lap): Lap {
  return {
    driverId: String(raw.driver_number),
    lapNumber: raw.lap_number,
    lapTimeSeconds: raw.lap_duration,
    sector1Seconds: raw.duration_sector_1,
    sector2Seconds: raw.duration_sector_2,
    sector3Seconds: raw.duration_sector_3,
    dateStart: raw.date_start,
  };
}

export function mapTelemetrySamples(
  samples: OpenF1CarData[],
  lapStartIso: string,
): TelemetrySample[] {
  const lapStartMs = Date.parse(lapStartIso);

  return samples
    .map((sample) => {
      const timestampMs = Date.parse(sample.date);
      return {
        timestamp: sample.date,
        relativeTimeSeconds: Number.isFinite(timestampMs)
          ? (timestampMs - lapStartMs) / 1000
          : 0,
        driverId: String(sample.driver_number),
        speed: sample.speed ?? 0,
        throttle: sample.throttle ?? 0,
        brake: sample.brake ?? 0,
        gear: sample.n_gear ?? 0,
        rpm: sample.rpm ?? 0,
      };
    })
    .sort((a, b) => a.relativeTimeSeconds - b.relativeTimeSeconds);
}
