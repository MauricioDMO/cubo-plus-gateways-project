import { randomInt } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { expect, it, vi } from "vitest";

vi.mock("@/modules/bookings/server/bookings", () => ({
  getBookingById: vi.fn(async (id: number) => ({
    id,
    status: "pending_payment",
  })),
}));

it.skipIf(process.env.PRISMA_TEST_DATABASE !== "1")(
  "handles simultaneous referral requests safely",
  async () => {
    loadEnvConfig(process.cwd(), true);

    const { db } = await import(
      "@/infrastructure/prisma/db"
    );

    const { recordReferralForBooking } = await import(
      "../referral-store"
    );

    const bookingId = randomInt(
      1_000_000_000,
      2_000_000_000
    );

    try {
      const results = await Promise.all([
        recordReferralForBooking(bookingId, "ROGER10"),
        recordReferralForBooking(bookingId, "ROGER10"),
      ]);

      expect(results.every((result) => result.ok)).toBe(true);

      expect(
        results.filter((result) => result.alreadyRecorded === false)
      ).toHaveLength(1);

      expect(
        results.filter((result) => result.alreadyRecorded === true)
      ).toHaveLength(1);

      const records = await db.orm.public.ReferralAttribution
        .where({ bookingId })
        .all();

      expect(records).toHaveLength(1);
      expect(records[0]?.referralCode).toBe("ROGER10");
    } finally {
      await db.orm.public.ReferralAttribution
        .where({ bookingId })
        .delete();

      await db.close();
    }
  },
  30_000
);