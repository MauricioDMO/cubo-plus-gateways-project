# Referral tracking and post-stay invitations

From src/, follow the [application setup](../../README.md) for PostgreSQL, media storage and catalogue import. Use Node 24+, a local guest account, the loopback BLOG_APP_ORIGIN, BLOG_SESSION_SECRET and NEXT_PUBLIC_SITE_URL. Guest checkout requires development mode. Running only referrals-setup.mjs starts the database and seeds a campaign. It does not import the property catalogue or configure guest login.

## Local demonstration
1. Run node scripts/referrals-setup.mjs with Docker configured, or migrate an isolated loopback database using pnpm db:migrate, then run node scripts/referrals-cli.mjs seed.
2. Set REFERRAL_ID_SECRET in the local server environment to a stable secret of at least 32 characters, generated with openssl rand -hex 32. Keep it out of source control and the client bundle. Issuing and checking issued links must use the same value. Changing it invalidates prior participant links. Existing campaign codes still work.
3. Start pnpm dev, visit /?ref=GETAWAYSDEMO and open a bookable listing. The optional field shows the inherited code. Check it, edit it or remove it. Continue through guest login and submit dates. The server validates again and records at most one attribution per booking. Code failure permits checkout at the normal price.
4. Run node scripts/referrals-cli.mjs report. The accepted booking should add one pending row. Complete the development-only mock payment and confirm the row changes to confirmed. An unauthenticated request, unchecked browser claim or contact click does not confirm a reservation.
5. After the operator checks actual departure and refund history, run node scripts/referrals-cli.mjs invite BOOKING_ID --stay-verified. Supply a past, confirmed booking with an account and no payment-review flag. Share the resulting URL. Reissuing for the same account returns its original code. Disabled participant codes remain disabled. The server excludes the same guest account from referral credit and validates active code for new attributions.
6. Run node scripts/referrals-demo.mts to demonstrate ten synthetic referral/return eligibility decisions. This is an operator policy simulation. No balance, discount, payout or ledger is created.

Existing commands: seed; create CODE; disable CODE; enable CODE; list; report. Operator actions use the existing local-only CLI. A disabled code cannot acquire new bookings. Existing attribution and its history survive deactivation. For cases and verification see the [Roger review](../../../strategy/roger/README.md).

## Persistence and limits
Booking, GuestAccount, ReferralCode and ReferralAttribution use PostgreSQL. The service locks the listing and booking while checking attribution and respects the unique booking ID. It synchronizes from the authoritative booking status. Initial attribution occurs after booking creation and can be lost during an outage. The two writes still need durable retry/reconciliation for production.

Only participant links encode a protected association to the issuing account. Campaign codes carry no owner. Duplicate identities across accounts require operator review. Completion and refund evidence is an operator attestation. A confirmed booking alone does not prove checkout occurred. Tracking is limited to a browser tab, form and login return URL. Production policy approval, attribution window, user consent, financial ledger, reversal process and maintenance ownership remain open.

## Verification
Run pnpm exec vitest run modules/referrals. For integration tests, set DATABASE_URL to a disposable local database with migrations applied, then PRISMA_TEST_DATABASE=1 pnpm exec vitest run modules/referrals --maxWorkers=1. Tests use synthetic listings/bookings and clean up their own fixtures. The broader native PostgreSQL/Docker concurrency checks live in modules/bookings/_test_/booking-db.test.ts.
