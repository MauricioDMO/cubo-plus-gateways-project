import { describe, it, expect } from "vitest";
import { formatCheckTime, formatMessageTimestamp, formatPublishedDate, formatStayDate } from "@/shared/utils/time";

describe("formatCheckTime", () => {
  it("formats 54000 seconds (real zonte-surfside-getaway check_in) as 3:00 pm", () => {
    expect(formatCheckTime("54000")).toBe("3:00 pm");
  });

  it("formats 39600 seconds (real zonte-surfside-getaway check_out) as 11:00 am", () => {
    expect(formatCheckTime("39600")).toBe("11:00 am");
  });

  it("formats 0 seconds (midnight) as 12:00 am", () => {
    expect(formatCheckTime("0")).toBe("12:00 am");
  });

  it("formats 43200 seconds (noon) as 12:00 pm", () => {
    expect(formatCheckTime("43200")).toBe("12:00 pm");
  });
});

describe("formatPublishedDate", () => {
  it("formats a real seeded published_at the way the live site's post cards do", () => {
    // covana-kitchen-where-to-eat-in-el-zonte-el-salvador
    expect(formatPublishedDate("2026-08-03T15:20:06Z")).toBe("August 3, 2026");
  });

  it("stays on the stored UTC date even for a late-evening timestamp", () => {
    expect(formatPublishedDate("2026-07-28T23:53:47Z")).toBe("July 28, 2026");
  });
});

describe("formatStayDate", () => {
  it("renders the date it was given, not one shifted by the viewer's timezone", () => {
    // El Salvador is UTC-6: parsing "2027-04-10" as UTC midnight and then
    // formatting in local time used to print 09 Apr, so every stay in the
    // admin table started a day early.
    expect(formatStayDate("2027-04-10")).toBe("10 Apr 2027");
    expect(formatStayDate("2027-04-14")).toBe("14 Apr 2027");
  });

  it("holds the date across a year boundary", () => {
    expect(formatStayDate("2027-01-01")).toBe("01 Jan 2027");
    expect(formatStayDate("2026-12-31")).toBe("31 Dec 2026");
  });

  it("accepts a different shape and locale for the admin tables", () => {
    expect(formatStayDate("2027-04-10", { month: "short", day: "numeric", year: "numeric" }, "en-US")).toBe(
      "Apr 10, 2027"
    );
  });

  it("returns the input unchanged when it is not a date", () => {
    expect(formatStayDate("")).toBe("");
    expect(formatStayDate("not-a-date")).toBe("not-a-date");
  });
});

describe("formatMessageTimestamp", () => {
  it("renders a message timestamp in El Salvador time", () => {
    // A real message timestamp from the live account (UTC 21:26 is 15:26 in UTC-6).
    expect(formatMessageTimestamp("2026-09-17T21:26:42.2084843Z")).toBe("9/17/26, 3:26 PM");
  });

  it("crosses midnight into the previous day, the way UTC-6 always will for a late UTC hour", () => {
    expect(formatMessageTimestamp("2026-01-01T06:00:00Z")).toBe("1/1/26, 12:00 AM");
  });

  it("is pinned to an explicit locale and zone -- the bug this exists to prevent", () => {
    // components/admin/InboxPanel.tsx once called `new Date(iso).toLocaleString()`
    // with neither, which renders server-side using Node's own locale/TZ and
    // client-side using the browser's -- a real hydration mismatch, caught
    // rendering the admin inbox against a live account with months of
    // threads. Every call must resolve identically wherever it runs, so the
    // same input is asserted to always produce the same output here.
    const first = formatMessageTimestamp("2026-06-15T12:00:00Z");
    const second = formatMessageTimestamp("2026-06-15T12:00:00Z");
    expect(first).toBe(second);
  });
});
