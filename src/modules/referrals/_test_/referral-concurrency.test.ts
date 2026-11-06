import { randomBytes } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { expect, it } from "vitest";


loadEnvConfig(process.cwd(), true);

it.skipIf(process.env.PRISMA_TEST_DATABASE !== "1")(
  "handles simultaneous attribution requests without duplicating records",
  async () => {
    const { db } = await import("@/infrastructure/prisma/db");
    const { recordReferralForBooking } = await import("../referral-store");
    const { createReferralBooking } = await import("./booking-fixture");
    const fixture = await createReferralBooking();
    const bookingId = fixture.id;
    const code = `T${randomBytes(7).toString("hex").toUpperCase()}`;
    let created = false;

    try {
      await db.orm.public.ReferralCode.create({ code, active: true });
      created = true;
      const results = await Promise.all([
        recordReferralForBooking(bookingId, code),
        recordReferralForBooking(bookingId, code),
      ]);
      expect(results.every((result) => result.ok)).toBe(true);
      expect(results.filter((result) => result.alreadyRecorded === false)).toHaveLength(1);
      expect(results.filter((result) => result.alreadyRecorded === true)).toHaveLength(1);
      const records = await db.orm.public.ReferralAttribution.where({ bookingId }).all();
      expect(records).toHaveLength(1);
      expect(records[0]?.referralCode).toBe(code);
    } finally {
      await db.orm.public.ReferralAttribution.where({ bookingId }).delete();
      if (created) await db.orm.public.ReferralCode.where({ code }).delete();
      await fixture.remove();
      await db.close();
    }
  },
  30_000
);
