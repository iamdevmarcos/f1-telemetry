import { describe, expect, it } from "vitest";

import {
  buildCarTrailSegments,
  trackSpan,
} from "@/lib/domain/replay-trail";
import type { ReplayFrame } from "@/lib/domain/types";

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

describe("buildCarTrailSegments", () => {
  it("keeps a continuous same-lap trail with sparse samples", () => {
    const frames = [
      frame({ relativeTimeSeconds: 10, lapNumber: 2, x: 0, y: 0 }),
      frame({ relativeTimeSeconds: 11.5, lapNumber: 2, x: 400, y: 0 }),
      frame({ relativeTimeSeconds: 13, lapNumber: 2, x: 800, y: 0 }),
    ];

    expect(buildCarTrailSegments(frames, 2, 10000)).toEqual([
      [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 800, y: 0 },
      ],
    ]);
  });

  it("does not cross lap boundaries", () => {
    const frames = [
      frame({ relativeTimeSeconds: 8, lapNumber: 1, x: 0, y: 0 }),
      frame({ relativeTimeSeconds: 9, lapNumber: 1, x: 200, y: 0 }),
      frame({ relativeTimeSeconds: 10, lapNumber: 2, x: 400, y: 0 }),
      frame({ relativeTimeSeconds: 11, lapNumber: 2, x: 600, y: 0 }),
    ];

    expect(buildCarTrailSegments(frames, 3, 10000)).toEqual([
      [
        { x: 400, y: 0 },
        { x: 600, y: 0 },
      ],
    ]);
  });

  it("breaks on teleports across the circuit", () => {
    const frames = [
      frame({ relativeTimeSeconds: 10, lapNumber: 1, x: 0, y: 0 }),
      frame({ relativeTimeSeconds: 11, lapNumber: 1, x: 300, y: 0 }),
      frame({ relativeTimeSeconds: 11.2, lapNumber: 1, x: 9000, y: 9000 }),
      frame({ relativeTimeSeconds: 12, lapNumber: 1, x: 9300, y: 9000 }),
    ];

    expect(buildCarTrailSegments(frames, 3, 12000)).toEqual([
      [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
      ],
      [
        { x: 9000, y: 9000 },
        { x: 9300, y: 9000 },
      ],
    ]);
  });

  it("breaks on large time gaps", () => {
    const frames = [
      frame({ relativeTimeSeconds: 10, lapNumber: 1, x: 0, y: 0 }),
      frame({ relativeTimeSeconds: 11, lapNumber: 1, x: 200, y: 0 }),
      frame({ relativeTimeSeconds: 16, lapNumber: 1, x: 400, y: 0 }),
      frame({ relativeTimeSeconds: 17, lapNumber: 1, x: 600, y: 0 }),
    ];

    expect(buildCarTrailSegments(frames, 3, 10000)).toEqual([
      [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
      ],
      [
        { x: 400, y: 0 },
        { x: 600, y: 0 },
      ],
    ]);
  });
});
