# Getaways El Salvador: student repo (mock Bitcoin checkout)

This is the public website of Getaways El Salvador, a vacation-rental business, prepared as a class project. The site, the property pages, the photos and the blog run locally. The booking flow runs up to the payment step. The payment step is a **starter stub**: your job is to build the mock Bitcoin payment. See [TASK.md](./TASK.md).

Resumen en español: este repositorio es la versión pública de la web de Getaways El Salvador. Todo corre en local, sin claves ni cuentas. El pago con Bitcoin es un "stub" que ustedes deben completar. Las instrucciones completas están en [TASK.md](./TASK.md) (sección en español al final).

## Requirements

- Node.js 20 or newer
- npm

No `.env` file, API key or account is needed.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Other useful commands:

```bash
npx tsc --noEmit -p .   # type check
npx vitest run          # tests
npx next build          # production build
```

## Project map

| Where | What lives there |
| --- | --- |
| `app/(site)/` | Public pages: home, properties, listing detail, blog, about, concierge. |
| `app/(site)/[...segments]/` | Catch-all route that renders content pages from `data/pages.json`. |
| `app/(site)/listing/[slug]/` | One property page, with photos, quote box and booking widget. |
| `app/checkout/page.tsx` | Checkout: itemized bill, coupon and the payment method. |
| `app/(site)/booking-confirmation/` | Confirmation page, read from the booking store. |
| `app/api/bookings/` | Creates a booking with its quoted total. |
| `app/api/checkout/quote/` | Price quote: nights, cleaning, extra guests, pets, coupon, IVA 13%, tourism tax 5%. |
| `app/api/checkout/status/` | Reads booking status. |
| `app/api/checkout/btc/` | **Student work.** Starter route for the Bitcoin payment. |
| `app/api/listings/[id]/availability/` | Availability for a listing (confirmed bookings only). |
| `lib/booking-quote.ts` | Real pricing logic. Keep it. |
| `lib/booking-store.ts` | Bookings in memory, saved to `.data/bookings.json` (gitignored). `markPaid()` lives here. |
| `lib/bookings.ts`, `lib/checkout-session.ts` | Booking helpers used by the pages and routes. |
| `lib/coupons.ts`, `lib/coupon-rules.ts` | Coupon lookup. The sample code is `GETAWAYS10` (10% off). |
| `lib/payments/types.ts` | The `PaymentProvider` contract that students implement. |
| `lib/payments/btc-mock.ts` | **Student work.** Starter stub for the Bitcoin provider. |
| `lib/payments/index.ts` | Exports the active payment provider. |
| `components/BitcoinPanel.tsx` | **Student work.** Bitcoin payment UI shown on checkout. |
| `components/CheckoutExtras.tsx`, `components/CheckoutMethods.tsx` | Checkout bill and payment-method area. |
| `lib/supabase.ts` | Local, read-only data client built from `data/*.json`. No database. |
| `lib/content.ts` | Functions that read pages, posts, listings and terms. Signatures are stable. |
| `lib/media.ts` | Turns a media path into a URL under `/media/`. |
| `data/*.json` | Public site data: pages, posts, listings (with prices), terms, media index. |
| `public/media/` | Photos and files referenced by `data/media.json`. |
| `test/` | Test helpers, including the data double. |

## How data works

- The site does not connect to a database. `data/*.json` holds everything a visitor can see on the public site: pages, blog posts, listings with their prices, terms and the media index.
- `lib/supabase.ts` gives the rest of the code a small query interface over those JSON files. It is read-only. Edits to the JSON files show up after a reload.
- Photos are in `public/media/`. A path such as `listings/casa-x/01.jpg` in the data is served at `/media/listings/casa-x/01.jpg`.
- Bookings are different: they are created while you use the site. They are kept in memory and saved to `.data/bookings.json`, so a dev restart keeps them. Delete that folder to reset all bookings.
- The public data has no guest data, no staff data and no keys.

## Secrets

Nothing in this repo is secret. You do not need to create `.env.local`. Do not add real API keys, wallet seeds or private data to this repo. If you need configuration, put it in `.env.local` (already gitignored) and never commit it.

## Notes

- This is Next.js 16. Read [AGENTS.md](./AGENTS.md) before you write code, and check `node_modules/next/dist/docs/` when unsure about an API.
- Photos, texts and the brand belong to Getaways El Salvador. See [LICENSE-NOTE.md](./LICENSE-NOTE.md).
