import { randomBytes } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { expect, it } from "vitest";


loadEnvConfig(process.cwd(), true);

it.skipIf(process.env.PRISMA_TEST_DATABASE !== "1")(
  "attributes valid codes once, and rejects invalid/replacement codes",
  async () => {
    const { db } = await import("@/infrastructure/prisma/db");
    const { recordReferralForBooking } = await import("../referral-store");
    const { syncReferralStatusForBooking } = await import("../referral-lifecycle");
    const { createReferralBooking } = await import("./booking-fixture");
    const fixture = await createReferralBooking();
    const bookingId = fixture.id;
    const code = `T${randomBytes(7).toString("hex").toUpperCase()}`;
    const unknownCode = `U${randomBytes(7).toString("hex").toUpperCase()}`;
    let created = false;

    try {
      await db.orm.public.ReferralCode.create({ code, active: true });
      created = true;

      expect(await recordReferralForBooking(bookingId, unknownCode))
        .toMatchObject({ ok: false, reason: "invalid_referral" });
      expect(await recordReferralForBooking(bookingId, code))
        .toMatchObject({ ok: true, alreadyRecorded: false, bookingId, code });
      expect(await recordReferralForBooking(bookingId, code))
        .toMatchObject({ ok: true, alreadyRecorded: true });
      expect(await recordReferralForBooking(bookingId, unknownCode))
        .toMatchObject({ ok: false, reason: "already_attributed" });

      const records = await db.orm.public.ReferralAttribution.where({ bookingId }).all();
      expect(records).toHaveLength(1);
      expect(records[0]?.referralCode).toBe(code);
      expect(records[0]?.status).toBe("pending");

      await db.orm.public.Booking.where({ id: bookingId }).update({ status: "confirmed" });
      expect(await syncReferralStatusForBooking(bookingId, "confirmed")).toBe(true);
      expect(await syncReferralStatusForBooking(bookingId, "confirmed")).toBe(true);
      expect((await db.orm.public.ReferralAttribution.where({ bookingId }).first())?.status)
        .toBe("confirmed");
      await db.orm.public.Booking.where({ id: bookingId }).update({ status: "cancelled" });
      expect(await syncReferralStatusForBooking(bookingId, "cancelled")).toBe(true);
      expect((await db.orm.public.ReferralAttribution.where({ bookingId }).first())?.status)
        .toBe("cancelled");
    } finally {
      await db.orm.public.ReferralAttribution.where({ bookingId }).delete();
      if (created) await db.orm.public.ReferralCode.where({ code }).delete();
      await fixture.remove();
      await db.close();
    }
  },
  30_000
);
