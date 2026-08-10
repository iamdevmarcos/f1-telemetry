import { describe, expect, it } from "vitest";

import {
  buildCompareSharePath,
  buildReplaySharePath,
  parseExplorerShareParams,
} from "@/lib/domain/share-links";

describe("buildReplaySharePath", () => {
  it("builds a solo replay path", () => {
    expect(
      buildReplaySharePath({ sessionId: "11299", driverId: "44" }),
    ).toBe("/?session=11299&driver=44");
  });

  it("includes optional battle driver", () => {
    expect(
      buildReplaySharePath({
        sessionId: "11299",
        driverId: "44",
        driverBId: "16",
      }),
    ).toBe("/?session=11299&driver=44&driverB=16");
  });
});

describe("buildCompareSharePath", () => {
  it("builds a compare path with lap", () => {
    expect(
      buildCompareSharePath({
        sessionId: "11299",
        driverAId: "44",
        driverBId: "16",
        lapNumber: 17,
      }),
    ).toBe("/?mode=compare&session=11299&driverA=44&driverB=16&lap=17");
  });
});

describe("parseExplorerShareParams", () => {
  it("parses replay params", () => {
    const parsed = parseExplorerShareParams(
      new URLSearchParams("session=1&driver=44&driverB=16"),
    );

    expect(parsed).toEqual({
      mode: "replay",
      sessionId: "1",
      driverId: "44",
      driverBId: "16",
      driverAId: null,
      lapNumber: null,
    });
  });

  it("parses compare params", () => {
    const parsed = parseExplorerShareParams(
      new URLSearchParams(
        "mode=compare&session=1&driverA=44&driverB=16&lap=4",
      ),
    );

    expect(parsed.mode).toBe("compare");
    expect(parsed.lapNumber).toBe("4");
    expect(parsed.driverAId).toBe("44");
  });
});
