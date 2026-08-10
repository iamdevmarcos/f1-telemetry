import { describe, expect, it, vi } from "vitest";

import { isRaceAvailable, isRaceUpcoming } from "@/lib/domain/session";

describe("isRaceUpcoming", () => {
  it("returns true when race start is in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T12:00:00.000Z"));

    expect(
      isRaceUpcoming({ dateStart: "2026-12-06T13:00:00+00:00" }),
    ).toBe(true);

    vi.useRealTimers();
  });

  it("returns false when race has already started", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T12:00:00.000Z"));

    expect(
      isRaceUpcoming({ dateStart: "2026-03-08T04:00:00+00:00" }),
    ).toBe(false);
    expect(isRaceAvailable({ dateStart: "2026-03-08T04:00:00+00:00" })).toBe(
      true,
    );

    vi.useRealTimers();
  });
});
