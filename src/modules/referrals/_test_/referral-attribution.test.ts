import { randomInt } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { expect, it, vi } from "vitest";

// Simulate an existing pending booking.
// We do not modify the team's booking store.
vi.mock("@/modules/bookings/server/bookings", () => ({
  getBookingById: vi.fn(async (id: number) => ({
    id,
    status: "pending_payment",
  })),
}));

loadEnvConfig(process.cwd(), true);

it.skipIf(process.env.PRISMA_TEST_DATABASE !== "1")(
  "records a referral without duplicates",
  async () => {
    const { db } = await import(
      "@/infrastructure/prisma/db"
    );

    const { recordReferralForBooking } = await import(
      "../referral-store"
    );

    // Use a temporary test booking ID.
    const bookingId = randomInt(
      1_000_000_000,
      2_000_000_000
    );

    try {
      // Test 1: Reject an unknown referral.
      const invalid = await recordReferralForBooking(
        bookingId,
        "UNKNOWN123"
      );

      expect(invalid).toMatchObject({
        ok: false,
        reason: "invalid_referral",
      });

      // Test 2: Register a valid referral.
      const first = await recordReferralForBooking(
        bookingId,
        "ROGER10"
      );

      expect(first).toMatchObject({
        ok: true,
        alreadyRecorded: false,
        bookingId,
        code: "ROGER10",
      });

      // Test 3: Repeating the same code is safe.
      const repeated = await recordReferralForBooking(
        bookingId,
        "ROGER10"
      );

      expect(repeated).toMatchObject({
        ok: true,
        alreadyRecorded: true,
      });

      // Test 4: Another code cannot replace it.
      const different = await recordReferralForBooking(
        bookingId,
        "DIFFERENT123"
      );

      expect(different).toMatchObject({
        ok: false,
        reason: "already_attributed",
      });

      // Test 5: Verify PostgreSQL has one record.
      const records = await db.orm.public.ReferralAttribution
        .where({ bookingId })
        .all();

      expect(records).toHaveLength(1);
      expect(records[0]?.referralCode).toBe("ROGER10");

    } finally {
      // Remove only the temporary test attribution.
      await db.orm.public.ReferralAttribution
        .where({ bookingId })
        .delete();

      await db.close();
    }
  },
  30_000
);