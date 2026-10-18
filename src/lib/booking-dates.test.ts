import { describe, expect, it } from "vitest";

import { addDaysIso, isoDateToLocalDate, nightsBetween, stayFromCheckIn, todayIso } from "./booking-dates";

describe("addDaysIso", () => {
  it("crosses a month boundary", () => {
    expect(addDaysIso("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("crosses a year boundary", () => {
    expect(addDaysIso("2026-12-31", 2)).toBe("2027-01-02");
  });

  it("knows 2028 is a leap year and 2027 is not", () => {
    expect(addDaysIso("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysIso("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("does not shift the day when the machine is west of UTC", () => {
    /*
     * The reason these functions parse "YYYY-MM-DDT00:00:00Z" rather than
     * "YYYY-MM-DD". El Salvador is UTC-6: parsed as local time and formatted
     * back through toISOString(), midnight on the 1st becomes 06:00 on the 1st
     * -- fine -- but midnight local on the 1st in a UTC+X zone becomes the day
     * before, and the guest is quoted a night they did not ask for.
     */
    expect(addDaysIso("2026-03-01", 0)).toBe("2026-03-01");
    expect(addDaysIso("2026-03-01", 30)).toBe("2026-03-31");
  });
});

describe("nightsBetween", () => {
  it("counts nights, not days", () => {
    expect(nightsBetween("2026-09-01", "2026-09-04")).toBe(3);
  });

  it("is zero for the same day and for a missing half", () => {
    expect(nightsBetween("2026-09-01", "2026-09-01")).toBe(0);
    expect(nightsBetween("", "2026-09-04")).toBe(0);
    expect(nightsBetween("2026-09-01", "")).toBe(0);
  });

  it("is not thrown off by a daylight-saving change", () => {
    // 25- and 23-hour days exist in local time; these dates are UTC, so a
    // March week is seven nights wherever the guest is sitting.
    expect(nightsBetween("2026-03-25", "2026-04-01")).toBe(7);
  });
});

describe("stayFromCheckIn", () => {
  it("leaves a check-out that is already far enough out alone", () => {
    expect(stayFromCheckIn("2026-09-01", "2026-09-10", 2)).toEqual({
      checkIn: "2026-09-01",
      checkOut: "2026-09-10",
    });
  });

  it("pushes check-out out when the new check-in leaves too few nights", () => {
    // A three-night minimum with check-in moved to the day before check-out:
    // leaving it would show a one-night stay the form then refuses to submit,
    // with nothing on screen saying why.
    expect(stayFromCheckIn("2026-09-09", "2026-09-10", 3).checkOut).toBe("2026-09-12");
  });

  it("pushes check-out out when check-in moves past it", () => {
    expect(stayFromCheckIn("2026-09-20", "2026-09-10", 1).checkOut).toBe("2026-09-21");
  });

  it("fills in a missing check-out", () => {
    expect(stayFromCheckIn("2026-09-01", "", 4).checkOut).toBe("2026-09-05");
  });

  it("treats a minimum of zero or less as one night", () => {
    // booking_min_length is free text in the attributes bag; "0" would
    // otherwise produce a check-out equal to check-in, which is not a stay.
    expect(stayFromCheckIn("2026-09-01", "", 0).checkOut).toBe("2026-09-02");
    expect(stayFromCheckIn("2026-09-01", "", -3).checkOut).toBe("2026-09-02");
  });

  it("falls back to today when check-in is cleared", () => {
    expect(stayFromCheckIn("", "", 1).checkOut).toBe(addDaysIso(todayIso(), 1));
  });
});

describe("isoDateToLocalDate", () => {
  it("keeps the day the column says, whatever the reader's time zone", () => {
    /*
     * new Date("2026-10-20") is midnight UTC, which in El Salvador (UTC-6) is
     * the 19th at 18:00 -- so a request asking for a call on the 20th was
     * listed in the admin as the 19th. Found on a real row, not in review.
     */
    const date = isoDateToLocalDate("2026-10-20")!;
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(20);
  });

  it("keeps the first of the month on the first", () => {
    // The worst case: a shift here moves the month as well as the day.
    const date = isoDateToLocalDate("2027-01-01")!;
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2027, 0, 1]);
  });

  it("gives nothing back for nothing, or for a date that is not one", () => {
    for (const value of [null, undefined, "", "tomorrow", "2026-02-31", "2026-13-01"]) {
      expect(isoDateToLocalDate(value), String(value)).toBeNull();
    }
  });
});
