import { describe, expect, it } from "vitest";

import { buildNewsSlug, slugifyTitle } from "@/lib/domain/news";

describe("slugifyTitle", () => {
  it("normalizes titles into URL-safe slugs", () => {
    expect(slugifyTitle("Verstappen wins in São Paulo!")).toBe(
      "verstappen-wins-in-sao-paulo",
    );
  });
});

describe("buildNewsSlug", () => {
  it("appends a short source key", () => {
    expect(buildNewsSlug("Ferrari updates", "motorsport")).toBe(
      "ferrari-updates-motorsport",
    );
  });
});
