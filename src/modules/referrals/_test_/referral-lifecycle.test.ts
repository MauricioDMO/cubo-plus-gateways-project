import { randomBytes } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { expect, it } from "vitest";

loadEnvConfig(process.cwd(), true);

it.skipIf(process.env.PRISMA_TEST_DATABASE !== "1")(
  "syncs only authoritative booking statuses and remains idempotent",
  async () => {
    const { db } = await import("@/infrastructure/prisma/db");
    const { syncReferralStatusForBooking } = await import("../referral-lifecycle");
    const { createReferralBooking } = await import("./booking-fixture");
    const fixture = await createReferralBooking();
    const bookingId = fixture.id;
    const code = `T${randomBytes(7).toString("hex").toUpperCase()}`;
    let codeCreated = false;
    let attributionCreated = false;
    try {
      await db.orm.public.ReferralCode.create({ code, active: true });
      codeCreated = true;
      await db.orm.public.ReferralAttribution.create({ bookingId, referralCode: code, status: "pending" });
      attributionCreated = true;

      expect(await syncReferralStatusForBooking(bookingId, "pending_payment")).toBe(false);
      expect((await db.orm.public.ReferralAttribution.where({ bookingId }).first())?.status).toBe("pending");
      await db.orm.public.Booking.where({ id: bookingId }).update({ status: "confirmed" });
      expect(await syncReferralStatusForBooking(bookingId, "confirmed")).toBe(true);
      expect(await syncReferralStatusForBooking(bookingId, "confirmed")).toBe(true);
      expect((await db.orm.public.ReferralAttribution.where({ bookingId }).first())?.status).toBe("confirmed");
      await db.orm.public.Booking.where({ id: bookingId }).update({ status: "cancelled" });
      expect(await syncReferralStatusForBooking(bookingId, "cancelled")).toBe(true);
      expect((await db.orm.public.ReferralAttribution.where({ bookingId }).first())?.status).toBe("cancelled");
      expect(await syncReferralStatusForBooking(-1, "confirmed")).toBe(false);
    } finally {
      if (attributionCreated) await db.orm.public.ReferralAttribution.where({ bookingId }).delete();
      if (codeCreated) await db.orm.public.ReferralCode.where({ code }).delete();
      await fixture.remove();
      await db.close();
    }
  },
  30_000
);
