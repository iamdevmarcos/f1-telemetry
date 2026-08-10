import { describe, expect, it } from "vitest";

import {
  buildReplayFrames,
  buildTrackPath,
  downsampleReplayFrames,
  resolveLapNumber,
} from "@/lib/domain/replay";
import type { Lap } from "@/lib/domain/types";

const laps: Lap[] = [
  {
    driverId: "44",
    lapNumber: 1,
    lapTimeSeconds: 90,
    sector1Seconds: 30,
    sector2Seconds: 30,
    sector3Seconds: 30,
    dateStart: "2025-01-01T12:00:00.000Z",
  },
  {
    driverId: "44",
    lapNumber: 2,
    lapTimeSeconds: 89,
    sector1Seconds: 29,
    sector2Seconds: 30,
    sector3Seconds: 30,
    dateStart: "2025-01-01T12:01:30.000Z",
  },
];

describe("resolveLapNumber", () => {
  it("maps timestamps into the active lap window", () => {
    expect(resolveLapNumber(Date.parse("2025-01-01T12:00:10.000Z"), laps)).toBe(
      1,
    );
    expect(resolveLapNumber(Date.parse("2025-01-01T12:01:40.000Z"), laps)).toBe(
      2,
    );
  });
});

describe("buildReplayFrames", () => {
  it("merges nearest car telemetry onto location samples", () => {
    const frames = buildReplayFrames({
      raceStartMs: Date.parse("2025-01-01T12:00:00.000Z"),
      laps,
      locations: [
        {
          timestampMs: Date.parse("2025-01-01T12:00:01.000Z"),
          timestamp: "2025-01-01T12:00:01.000Z",
          x: 10,
          y: 20,
        },
      ],
      carSamples: [
        {
          timestampMs: Date.parse("2025-01-01T12:00:01.100Z"),
          speed: 250,
          throttle: 99,
          brake: 0,
          gear: 7,
          rpm: 11000,
        },
      ],
    });

    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({
      lapNumber: 1,
      speed: 250,
      gear: 7,
      x: 10,
      y: 20,
      relativeTimeSeconds: 1,
    });
  });
});

describe("downsampleReplayFrames", () => {
  it("keeps the last frame", () => {
    const frames = Array.from({ length: 500 }, (_, index) => ({
      timestamp: `t-${index}`,
      relativeTimeSeconds: index,
      lapNumber: 1,
      x: index,
      y: index,
      speed: index,
      throttle: 100,
      brake: 0,
      gear: 7,
      rpm: 10000,
    }));

    const result = downsampleReplayFrames(frames, 100);
    expect(result.length).toBeLessThanOrEqual(101);
    expect(result[result.length - 1]?.speed).toBe(499);
  });
});

describe("buildTrackPath", () => {
  it("downsamples outline points", () => {
    const points = Array.from({ length: 400 }, (_, index) => ({
      x: index,
      y: index * 2,
    }));
    expect(buildTrackPath(points, 50).length).toBeLessThanOrEqual(51);
  });
});
