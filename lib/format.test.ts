import { describe, expect, it } from "vitest";

import {
  formatRaceLabel,
  formatSessionRaceLabel,
  getRacePlaceName,
} from "@/lib/format";
import type { Session } from "@/lib/domain/types";

const baseSession: Session = {
  id: "1",
  year: 2026,
  countryName: "Hungary",
  circuitShortName: "Hungaroring",
  location: "Budapest",
  sessionName: "Race",
  sessionType: "Race",
  dateStart: "2026-07-26T13:00:00+00:00",
  dateEnd: "2026-07-26T15:00:00+00:00",
  isUpcoming: false,
};

describe("getRacePlaceName", () => {
  it("uses country name for a single race in that country", () => {
    expect(getRacePlaceName(baseSession, [baseSession])).toBe("Hungary");
  });

  it("adds location when the same country hosts multiple races", () => {
    const miami: Session = {
      ...baseSession,
      id: "2",
      countryName: "United States",
      location: "Miami",
      circuitShortName: "Miami",
    };
    const austin: Session = {
      ...baseSession,
      id: "3",
      countryName: "United States",
      location: "Austin",
      circuitShortName: "Austin",
    };

    expect(getRacePlaceName(miami, [miami, austin])).toBe(
      "United States · Miami",
    );
  });
});

describe("formatSessionRaceLabel", () => {
  it("formats country and date", () => {
    expect(
      formatSessionRaceLabel(baseSession, [baseSession]),
    ).toBe("Hungary · 26 Jul 2026");
  });
});

describe("formatRaceLabel", () => {
  it("joins place name and date", () => {
    expect(
      formatRaceLabel({
        placeName: "Hungary",
        dateStart: "2026-07-26T13:00:00+00:00",
      }),
    ).toBe("Hungary · 26 Jul 2026");
  });
});
