import { describe, expect, it } from "vitest";

import {
  mapDriver,
  mapLap,
  mapSession,
  mapTelemetrySamples,
} from "@/lib/infrastructure/openf1/mappers";

describe("openf1 mappers", () => {
  it("maps session fields into domain model", () => {
    expect(
      mapSession({
        session_key: 9158,
        session_name: "Race",
        session_type: "Race",
        date_start: "2023-09-17T13:00:00+00:00",
        date_end: "2023-09-17T15:00:00+00:00",
        year: 2023,
        country_name: "Singapore",
        circuit_short_name: "Marina Bay",
        location: "Marina Bay",
        meeting_key: 1219,
      }),
    ).toMatchObject({
      id: "9158",
      sessionName: "Race",
      circuitShortName: "Marina Bay",
      year: 2023,
      isUpcoming: false,
    });
  });

  it("normalizes team colour with hash prefix", () => {
    expect(
      mapDriver({
        driver_number: 1,
        name_acronym: "VER",
        full_name: "Max VERSTAPPEN",
        team_name: "Red Bull Racing",
        team_colour: "3671C6",
        session_key: 9158,
      }).teamColour,
    ).toBe("#3671C6");
  });

  it("maps lap timings", () => {
    expect(
      mapLap({
        session_key: 9161,
        driver_number: 63,
        lap_number: 8,
        lap_duration: 91.743,
        duration_sector_1: 26.966,
        duration_sector_2: 38.657,
        duration_sector_3: 26.12,
        date_start: "2023-09-16T13:59:07.606000+00:00",
      }),
    ).toMatchObject({
      driverId: "63",
      lapNumber: 8,
      lapTimeSeconds: 91.743,
      sector2Seconds: 38.657,
    });
  });

  it("maps telemetry relative to lap start", () => {
    const samples = mapTelemetrySamples(
      [
        {
          session_key: 9159,
          driver_number: 55,
          date: "2023-09-15T13:00:01.000Z",
          speed: 280,
          throttle: 99,
          brake: 0,
          n_gear: 7,
          rpm: 11000,
        },
        {
          session_key: 9159,
          driver_number: 55,
          date: "2023-09-15T13:00:00.000Z",
          speed: 250,
          throttle: 80,
          brake: 0,
          n_gear: 6,
          rpm: 10500,
        },
      ],
      "2023-09-15T13:00:00.000Z",
    );

    expect(samples).toHaveLength(2);
    expect(samples[0]?.relativeTimeSeconds).toBe(0);
    expect(samples[1]?.relativeTimeSeconds).toBe(1);
    expect(samples[1]?.speed).toBe(280);
  });
});
