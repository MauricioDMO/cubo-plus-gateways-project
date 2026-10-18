import { describe, it, expect } from "vitest";
import { isBlogDatePath } from "@/modules/content/paths";

/*
 * Regression: every four-segment URL was interpolated straight into a
 * timestamp literal and sent to Postgres, which rejected it with a 22007 the
 * route then surfaced as a 500. Verified live before the fix -- /a/b/c/d and
 * /2026/13/99/foo both returned 500, and now return 404.
 */
describe("isBlogDatePath", () => {
  it("accepts the shape a real blog permalink uses", () => {
    expect(isBlogDatePath("2026", "03", "06")).toBe(true);
    expect(isBlogDatePath("2024", "02", "29")).toBe(true); // leap day
  });

  it("rejects segments that are not a date at all", () => {
    expect(isBlogDatePath("api", "admin", "media")).toBe(false);
    expect(isBlogDatePath("a", "b", "c")).toBe(false);
    expect(isBlogDatePath("", "", "")).toBe(false);
  });

  it("rejects out-of-range months and days", () => {
    expect(isBlogDatePath("2026", "13", "01")).toBe(false);
    expect(isBlogDatePath("2026", "00", "01")).toBe(false);
    expect(isBlogDatePath("2026", "01", "32")).toBe(false);
    expect(isBlogDatePath("2026", "01", "00")).toBe(false);
  });

  it("rejects a day that does not exist in that month, which Date would otherwise roll forward", () => {
    expect(isBlogDatePath("2026", "02", "30")).toBe(false);
    expect(isBlogDatePath("2026", "02", "29")).toBe(false); // 2026 is not a leap year
    expect(isBlogDatePath("2026", "04", "31")).toBe(false);
  });

  it("requires zero-padded two-digit month and day, as the permalinks are generated", () => {
    expect(isBlogDatePath("2026", "3", "6")).toBe(false);
    expect(isBlogDatePath("26", "03", "06")).toBe(false);
  });
});
