import { describe, expect, it } from "vitest";

import {
  buildCarTrailSegments,
  nearestTrackIndex,
  trackSpan,
} from "@/lib/domain/replay-trail";
import type { ReplayFrame, TrackPoint } from "@/lib/domain/types";

function frame(
  overrides: Partial<ReplayFrame> &
    Pick<ReplayFrame, "relativeTimeSeconds" | "x" | "y" | "lapNumber">,
): ReplayFrame {
  return {
    timestamp: "2024-01-01T12:00:00.000Z",
    speed: 200,
    throttle: 100,
    brake: 0,
    gear: 7,
    rpm: 10000,
    ...overrides,
  };
}

/** Dense L-shaped track: horizontal then vertical. */
const cornerTrack: TrackPoint[] = Array.from({ length: 31 }, (_, index) => {
  if (index <= 15) {
    return { x: index * 20, y: 0 };
  }
  return { x: 300, y: (index - 15) * 20 };
});

describe("trackSpan", () => {
  it("returns diagonal length of bounds", () => {
    expect(
      trackSpan([
        { x: 0, y: 0 },
        { x: 3, y: 4 },
      ]),
    ).toBe(5);
  });
});

describe("nearestTrackIndex", () => {
  it("finds the closest outline vertex", () => {
    expect(nearestTrackIndex({ x: 295, y: 5 }, cornerTrack)).toBe(15);
  });
});

describe("buildCarTrailSegments", () => {
  it("follows the track around a corner instead of drawing a chord", () => {
    // Samples near the elbow: a straight GPS chord cuts inside the L.
    const frames = [
      frame({ relativeTimeSeconds: 10, lapNumber: 1, x: 260, y: 2 }),
      frame({ relativeTimeSeconds: 11.5, lapNumber: 1, x: 302, y: 80 }),
    ];

    const segments = buildCarTrailSegments(frames, 1, cornerTrack);
    const trail = segments[0] ?? [];

    expect(trail.some((point) => point.x === 300 && point.y === 0)).toBe(true);
    expect(trail.some((point) => point.x === 300 && point.y === 40)).toBe(
      true,
    );
  });

  it("does not cross lap boundaries", () => {
    const frames = [
      frame({ relativeTimeSeconds: 8, lapNumber: 1, x: 0, y: 0 }),
      frame({ relativeTimeSeconds: 9, lapNumber: 1, x: 200, y: 0 }),
      frame({ relativeTimeSeconds: 10, lapNumber: 2, x: 300, y: 40 }),
      frame({ relativeTimeSeconds: 11, lapNumber: 2, x: 300, y: 200 }),
    ];

    const segments = buildCarTrailSegments(frames, 3, cornerTrack);
    const trail = segments.flat();

    expect(trail.some((point) => point.x === 0 && point.y === 0)).toBe(false);
    expect(trail.some((point) => point.x === 300 && point.y === 200)).toBe(
      true,
    );
  });

  it("breaks on large time gaps", () => {
    const frames = [
      frame({ relativeTimeSeconds: 10, lapNumber: 1, x: 0, y: 0 }),
      frame({ relativeTimeSeconds: 11, lapNumber: 1, x: 200, y: 0 }),
      frame({ relativeTimeSeconds: 16, lapNumber: 1, x: 300, y: 40 }),
      frame({ relativeTimeSeconds: 17, lapNumber: 1, x: 300, y: 200 }),
    ];

    const segments = buildCarTrailSegments(frames, 3, cornerTrack);
    expect(segments.length).toBeGreaterThanOrEqual(2);
  });

  it("breaks on snap glitches that jump across most of the outline", () => {
    const frames = [
      frame({ relativeTimeSeconds: 10, lapNumber: 1, x: 0, y: 0 }),
      frame({ relativeTimeSeconds: 11, lapNumber: 1, x: 40, y: 0 }),
      // Nearest index near the end of the outline — >45% jump.
      frame({ relativeTimeSeconds: 11.5, lapNumber: 1, x: 300, y: 300 }),
      frame({ relativeTimeSeconds: 12, lapNumber: 1, x: 300, y: 280 }),
    ];

    const segments = buildCarTrailSegments(frames, 3, cornerTrack);
    expect(segments.length).toBeGreaterThanOrEqual(2);
    expect(
      segments.some(
        (segment) =>
          segment.some((point) => point.x === 0 && point.y === 0) &&
          segment.some((point) => point.x === 300 && point.y === 300),
      ),
    ).toBe(false);
  });
});
