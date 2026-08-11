import { describe, expect, it } from "vitest";

import { classifyDrsStatus, formatDrsStatus } from "@/lib/domain/drs";

describe("classifyDrsStatus", () => {
  it("maps OpenF1 DRS codes", () => {
    expect(classifyDrsStatus(0)).toBe("off");
    expect(classifyDrsStatus(1)).toBe("off");
    expect(classifyDrsStatus(8)).toBe("eligible");
    expect(classifyDrsStatus(10)).toBe("on");
    expect(classifyDrsStatus(12)).toBe("on");
    expect(classifyDrsStatus(14)).toBe("on");
  });

  it("handles missing or unknown values", () => {
    expect(classifyDrsStatus(null)).toBe("unknown");
    expect(classifyDrsStatus(undefined)).toBe("unknown");
    expect(classifyDrsStatus(3)).toBe("unknown");
  });
});

describe("formatDrsStatus", () => {
  it("formats labels for the HUD", () => {
    expect(formatDrsStatus("on")).toBe("On");
    expect(formatDrsStatus("eligible")).toBe("Eligible");
    expect(formatDrsStatus("off")).toBe("Off");
    expect(formatDrsStatus("unknown")).toBe("—");
  });
});
