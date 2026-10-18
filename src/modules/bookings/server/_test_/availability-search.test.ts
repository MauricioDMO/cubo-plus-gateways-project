import { describe, expect, it } from "vitest";
import { parseSearchDates } from "@/modules/bookings/server/availability-search";

describe("parseSearchDates", () => {
  it("accepts a well-formed range", () => {
    expect(parseSearchDates("2026-09-01", "2026-09-05")).toEqual({
      checkIn: "2026-09-01",
      checkOut: "2026-09-05",
    });
  });

  it("treats a half-filled range as no date filter", () => {
    expect(parseSearchDates("2026-09-01", undefined)).toBeNull();
    expect(parseSearchDates(undefined, "2026-09-05")).toBeNull();
  });

  it("rejects a zero-night or reversed range instead of hiding everything", () => {
    expect(parseSearchDates("2026-09-05", "2026-09-05")).toBeNull();
    expect(parseSearchDates("2026-09-05", "2026-09-01")).toBeNull();
  });

  it("rejects anything that is not an ISO date, so a hand-edited URL cannot reach the query", () => {
    expect(parseSearchDates("tomorrow", "2026-09-05")).toBeNull();
    expect(parseSearchDates("2026-9-1", "2026-09-05")).toBeNull();
    expect(parseSearchDates("2026-09-01'; drop table bookings; --", "2026-09-05")).toBeNull();
  });
});
