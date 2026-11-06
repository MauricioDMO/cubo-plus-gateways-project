import { randomUUID } from "node:crypto";
import { db } from "@/infrastructure/prisma/db";

export async function createReferralBooking() {
  const { listing, booking } = await db.transaction(async tx => {
    const listing = await tx.orm.public.Listing.create({
      title: "Referral test", slug: "ref-" + randomUUID(), contentHtml: "", attributes: {}, active: false,
    });
    const booking = await tx.orm.public.Booking.create({
      listingId: listing.id, checkIn: "2099-01-01", checkOut: "2099-01-02", nights: 1,
      guestName: "Fixture", guestEmail: "fixture@example.test", currency: "USD", pricePerNightCents: 100n,
      cleaningFeeCents: 0n, petFeeCents: 0n, extraGuestFeeCents: 0n, discountCents: 0n, taxCents: 0n,
      totalAmountCents: 100n, status: "pending_payment", pricingReviewRequired: true, agreedListingTitle: listing.title,
    });
    return { listing, booking };
  });
  return { id: booking.id, async remove() {
    await db.transaction(async tx => {
      await tx.orm.public.Booking.where({ id: booking.id }).delete();
      await tx.orm.public.Listing.where({ id: listing.id }).delete();
    });
  }};
}
