/** Local development only. Never connect this command to an authenticated/production DB. */
import "temporal-polyfill/full/global";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { isParticipantCode, participantCode } from "../modules/referrals/participant-code.ts";
import postgres from "@prisma/orm-postgres/runtime";
import contractJson from "../infrastructure/prisma/contract.json" with { type: "json" };

loadEnvConfig(process.cwd(), true);
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing. Configure .env first.");
const parsed = new URL(url);
if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) {
  throw new Error("Refusing to operate on a non-local or production database.");
}

const codeOrNull = (input) => {
  const code = String(input ?? "").trim().toUpperCase();
  return /^[A-Z0-9-]{4,24}$/.test(code) ? code : null;
};
const [action = "help", rawCode, proof] = process.argv.slice(2);
const db = postgres({ contractJson, url });

try {
  if (action === "invite") {
    const bookingId = Number(rawCode);
    if (!Number.isSafeInteger(bookingId) || bookingId < 1 || proof !== "--stay-verified") {
      throw new Error("Usage: invite BOOKING_ID --stay-verified (operator has verified departure and no unresolved refund)");
    }
    const stay = await db.orm.public.Booking.where({ id: bookingId }).first();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" }).format(new Date());
    if (!stay?.guestAccountId || stay.status !== "confirmed" || stay.paymentReviewRequired || String(stay.checkOut) > today) {
      throw new Error("A past confirmed stay linked to a guest account and cleared for payment review is required.");
    }
    const code = participantCode(stay.guestAccountId, process.env.REFERRAL_ID_SECRET);
    if (!code) throw new Error("Configure a stable REFERRAL_ID_SECRET of at least 32 characters.");
    let record = await db.orm.public.ReferralCode.where({ code }).first();
    if (!record) {
      try { record = await db.orm.public.ReferralCode.create({ code, active: true }); }
      catch (error) {
        record = await db.orm.public.ReferralCode.where({ code }).first();
        if (!record) throw error;
      }
    }
    if (!record.active) throw new Error("Participant code is disabled.");
    const link = new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    link.searchParams.set("ref", code);
    console.log(link.href);
  } else if (action === "seed" || action === "create") {
    const code = action === "seed" ? "GETAWAYSDEMO" : codeOrNull(rawCode);
    if (!code) throw new Error("Usage: node scripts/referrals-cli.mjs create <CODE>");
    if (isParticipantCode(code)) throw new Error("Participant codes are issued with invite.");
    const existing = await db.orm.public.ReferralCode.where({ code }).first();
    if (existing) {
      if (action === "create") throw new Error(`Code already exists: ${code}`);
      if (!existing.active) {
        await db.orm.public.ReferralCode.where({ code }).update({ active: true });
        console.log(`Reactivated local demo referral: ${code}`);
      } else {
        console.log(`Demo code ready: ${code}`);
      }
    } else {
      const created = await db.orm.public.ReferralCode.create({ code, active: true });
      console.log(`Created referral: ${created.code}`);
    }
  } else if (action === "enable" || action === "disable") {
    const code = codeOrNull(rawCode);
    if (!code) throw new Error(`Usage: node scripts/referrals-cli.mjs ${action} <CODE>`);
    const updated = await db.orm.public.ReferralCode
      .where({ code }).update({ active: action === "enable" });
    if (!updated) throw new Error(`Code not found: ${code}`);
    console.log(`${updated.code}: active=${updated.active}`);
  } else if (action === "list") {
    const rows = await db.orm.public.ReferralCode.all();
    console.table(rows.map((row) => ({ code: row.code, active: row.active })));
  } else if (action === "report") {
    const [codes, attributions] = await Promise.all([
      db.orm.public.ReferralCode.all(),
      db.orm.public.ReferralAttribution.all(),
    ]);
    console.table(codes.map((row) => {
      const a = attributions.filter((item) => item.referralCode === row.code);
      return {
        code: row.code,
        active: row.active,
        total: a.length,
        pending: a.filter((x) => x.status === "pending").length,
        confirmed: a.filter((x) => x.status === "confirmed").length,
        cancelled: a.filter((x) => x.status === "cancelled").length,
      };
    }));
  } else {
    console.log("Usage: node scripts/referrals-cli.mjs seed | create CODE | enable CODE | disable CODE | list | report | invite BOOKING_ID --stay-verified");
  }
} finally {
  await db.close();
}
