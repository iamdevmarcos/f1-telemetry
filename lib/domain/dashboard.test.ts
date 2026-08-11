import { describe, expect, it } from "vitest";

import {
  buildLastLapSectors,
  buildRaceDashboard,
  classifySectorTone,
  formatRaceGap,
  parseRaceGap,
  resolveStintAtLap,
  snapshotRaceDashboard,
  tyreAgeAtLap,
} from "@/lib/domain/dashboard";
import type { Driver, Lap, ReplayFrame } from "@/lib/domain/types";

const driverA: Driver = {
  id: "1",
  number: 1,
  acronym: "VER",
  fullName: "Max Verstappen",
  teamName: "Red Bull Racing",
  teamColour: "#3671C6",
};

const driverB: Driver = {
  id: "16",
  number: 16,
  acronym: "LEC",
  fullName: "Charles Leclerc",
  teamName: "Ferrari",
  teamColour: "#E8002D",
};

const raceStartMs = Date.parse("2024-01-01T12:00:00.000Z");

function lap(
  driverId: string,
  lapNumber: number,
  time: number,
  dateStart: string,
  sectors?: {
    s1?: number | null;
    s2?: number | null;
    s3?: number | null;
  },
): Lap {
  return {
    driverId,
    lapNumber,
    lapTimeSeconds: time,
    sector1Seconds: sectors?.s1 ?? null,
    sector2Seconds: sectors?.s2 ?? null,
    sector3Seconds: sectors?.s3 ?? null,
    dateStart,
  };
}

function frame(
  lapNumber: number,
  relativeTimeSeconds: number,
  timestamp: string,
): ReplayFrame {
  return {
    timestamp,
    relativeTimeSeconds,
    lapNumber,
    x: 0,
    y: 0,
    speed: 280,
    throttle: 100,
    brake: 0,
    gear: 8,
    rpm: 11000,
  };
}

describe("parseRaceGap / formatRaceGap", () => {
  it("parses leader, seconds and lapped gaps", () => {
    expect(parseRaceGap(null)).toEqual({ type: "leader" });
    expect(parseRaceGap(1.234)).toEqual({ type: "seconds", value: 1.234 });
    expect(parseRaceGap("+1 LAP")).toEqual({ type: "laps", value: 1 });
  });

  it("formats gaps for UI", () => {
    expect(formatRaceGap({ type: "leader" })).toBe("Leader");
    expect(formatRaceGap({ type: "seconds", value: 2.5 })).toBe("+2.500");
    expect(formatRaceGap({ type: "laps", value: 2 })).toBe("+2 LAPS");
  });
});

describe("stint helpers", () => {
  it("resolves active stint and tyre age", () => {
    const stints = [
      {
        driverId: "1",
        stintNumber: 1,
        compound: "MEDIUM",
        lapStart: 1,
        lapEnd: 20,
        tyreAgeAtStart: 0,
      },
      {
        driverId: "1",
        stintNumber: 2,
        compound: "HARD",
        lapStart: 21,
        lapEnd: null,
        tyreAgeAtStart: 0,
      },
    ];

    const stint = resolveStintAtLap(stints, "1", 25);
    expect(stint?.compound).toBe("HARD");
    expect(tyreAgeAtLap(stint, 25)).toBe(4);
  });
});

describe("sector tones", () => {
  it("classifies purple, green and yellow correctly", () => {
    expect(classifySectorTone(25.1, 25.1, 25.1)).toBe("purple");
    expect(classifySectorTone(25.3, 25.3, 25.1)).toBe("green");
    expect(classifySectorTone(25.8, 25.3, 25.1)).toBe("yellow");
    expect(classifySectorTone(null, 25.1, 25.1)).toBe("none");
  });

  it("builds last-lap sector tones against personal and session bests", () => {
    const lastLap = lap("1", 2, 88, "2024-01-01T12:01:30.000Z", {
      s1: 28.0,
      s2: 36.5,
      s3: 26.8,
    });
    const driverLaps = [
      lap("1", 1, 90, "2024-01-01T12:00:00.000Z", {
        s1: 28.5,
        s2: 36.2,
        s3: 27.0,
      }),
      lastLap,
    ];
    const sessionLaps = [
      ...driverLaps,
      lap("16", 1, 89, "2024-01-01T12:00:01.000Z", {
        s1: 27.9,
        s2: 36.0,
        s3: 26.5,
      }),
    ];

    const sectors = buildLastLapSectors({
      lastLap,
      driverCompletedLaps: driverLaps,
      sessionCompletedLaps: sessionLaps,
    });

    expect(sectors[0]?.tone).toBe("green");
    expect(sectors[1]?.tone).toBe("yellow");
    expect(sectors[2]?.tone).toBe("green");
  });
});

describe("buildRaceDashboard + snapshotRaceDashboard", () => {
  it("builds timing grid with last/best/pits/sectors at a given time", () => {
    const dashboard = buildRaceDashboard({
      drivers: [driverA, driverB],
      raceStartMs,
      positions: [
        {
          date: "2024-01-01T12:00:00.000Z",
          driver_number: 1,
          position: 1,
        },
        {
          date: "2024-01-01T12:00:00.000Z",
          driver_number: 16,
          position: 2,
        },
        {
          date: "2024-01-01T12:10:00.000Z",
          driver_number: 16,
          position: 1,
        },
        {
          date: "2024-01-01T12:10:00.000Z",
          driver_number: 1,
          position: 2,
        },
      ],
      intervals: [
        {
          date: "2024-01-01T12:10:00.000Z",
          driver_number: 16,
          gap_to_leader: null,
          interval: null,
        },
        {
          date: "2024-01-01T12:10:00.000Z",
          driver_number: 1,
          gap_to_leader: 1.5,
          interval: 1.5,
        },
      ],
      stints: [
        {
          driver_number: 1,
          stint_number: 1,
          compound: "SOFT",
          lap_start: 1,
          lap_end: null,
          tyre_age_at_start: 0,
        },
        {
          driver_number: 16,
          stint_number: 1,
          compound: "MEDIUM",
          lap_start: 1,
          lap_end: null,
          tyre_age_at_start: 2,
        },
      ],
      pits: [
        {
          date: "2024-01-01T12:05:00.000Z",
          driver_number: 1,
          lap_number: 12,
          lane_duration: 22.1,
          pit_duration: 22.1,
          stop_duration: 2.3,
        },
      ],
      weather: [
        {
          date: "2024-01-01T12:05:00.000Z",
          air_temperature: 22,
          track_temperature: 32,
          humidity: 40,
          rainfall: 0,
          wind_speed: 2,
        },
      ],
      sessionLaps: [
        lap("1", 1, 90, "2024-01-01T12:00:00.000Z", {
          s1: 30,
          s2: 35,
          s3: 25,
        }),
        lap("1", 2, 89, "2024-01-01T12:01:30.000Z", {
          s1: 29.5,
          s2: 34.5,
          s3: 25,
        }),
        lap("16", 1, 91, "2024-01-01T12:00:01.000Z", {
          s1: 30.2,
          s2: 35.1,
          s3: 25.7,
        }),
        lap("16", 2, 88.5, "2024-01-01T12:01:32.000Z", {
          s1: 29.0,
          s2: 34.0,
          s3: 25.5,
        }),
      ],
    });

    expect(dashboard.fastestLap).toEqual({
      driverId: "16",
      lapNumber: 2,
      lapTimeSeconds: 88.5,
    });
    expect(dashboard.pits).toHaveLength(1);

    const focusedLaps: Lap[] = [
      lap("1", 1, 90, "2024-01-01T12:00:00.000Z"),
      lap("1", 2, 89, "2024-01-01T12:01:30.000Z"),
      {
        ...lap("1", 3, 0, "2024-01-01T12:03:00.000Z"),
        lapTimeSeconds: null,
      },
    ];

    const snapshot = snapshotRaceDashboard({
      dashboard,
      timeSeconds: 600,
      focusedDriver: driverA,
      focusedLaps,
      focusedFrames: [frame(3, 600, "2024-01-01T12:10:00.000Z")],
      focusedFrame: frame(3, 600, "2024-01-01T12:10:00.000Z"),
    });

    expect(snapshot.leaderboard[0]?.driver.acronym).toBe("LEC");
    expect(snapshot.leaderboard[1]?.driver.acronym).toBe("VER");
    expect(formatRaceGap(snapshot.leaderboard[1]?.gapToLeader)).toBe("+1.500");
    expect(snapshot.weather?.trackTempC).toBe(32);
    expect(snapshot.focused?.compound).toBe("S");
    expect(snapshot.focused?.lastLapSeconds).toBe(89);
    expect(snapshot.focused?.bestLapSeconds).toBe(89);
    expect(snapshot.focused?.position).toBe(2);

    const ver = snapshot.leaderboard[1]!;
    expect(ver.lastLapSeconds).toBe(89);
    expect(ver.bestLapSeconds).toBe(89);
    expect(ver.pitCount).toBe(1);
    expect(ver.lastPitLap).toBe(12);
    expect(ver.sectors[0]?.tone).toBe("green");
    expect(ver.sectors[1]?.tone).toBe("green");
    expect(ver.sectors[2]?.tone).toBe("purple");

    const lec = snapshot.leaderboard[0]!;
    expect(lec.lastLapSeconds).toBe(88.5);
    expect(lec.bestLapSeconds).toBe(88.5);
    expect(lec.pitCount).toBe(0);
    expect(lec.sectors[0]?.tone).toBe("purple");
    expect(lec.sectors[1]?.tone).toBe("purple");
    expect(lec.sectors[2]?.tone).toBe("green");
  });
});
