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
| `modules/bookings/booking-quote.ts` | Real pricing logic. Keep it. |
| `modules/bookings/server/booking-store.ts` | Bookings in memory, saved to `.data/bookings.json` (gitignored). `markPaid()` lives here. |
| `modules/bookings/server/bookings.ts`, `modules/checkout/checkout-session.ts` | Booking helpers used by the pages and routes. |
| `modules/coupons/server/coupons.ts`, `modules/coupons/coupon-rules.ts` | Coupon lookup. The sample code is `GETAWAYS10` (10% off). |
| `modules/payments/types.ts` | The `PaymentProvider` contract that students implement. |
| `modules/payments/btc-mock.ts` | **Student work.** Starter stub for the Bitcoin provider. |
| `modules/payments/index.ts` | Exports the active payment provider. |
| `components/organisms/BitcoinPanel.tsx` | **Student work.** Bitcoin payment UI shown on checkout. |
| `components/organisms/CheckoutExtras.tsx`, `components/organisms/CheckoutMethods.tsx` | Checkout bill and payment-method area. |
| `infrastructure/data/local-client.ts` | Local, read-only data client built from `data/*.json`. No database. |
| `modules/content/server/content.ts`, `modules/listings/server/listings.ts`, `shared/media/server/media.ts` | Editorial, catalogue and media queries, with unchanged function signatures. |
| `shared/media/media.ts` | Turns a media path into a URL under `/media/`. |
| `data/*.json` | Public site data: pages, posts, listings (with prices), terms, media index. |
| `public/media/` | Photos and files referenced by `data/media.json`. |
| `_test_/support/` | Test-only stand-in for `server-only`. |

### Organization and boundaries

- `app/` owns URLs, route handlers, layouts, metadata and route configuration (`dynamic`, etc.). Large routes compose a server data loader with a template; route files still export Next.js configuration directly.
- `components/atoms/` contains primitives (`ui/`), icons and the active navigation link. `molecules/` contains small compositions such as date/phone fields, post cards and contact details. `organisms/` contains navigation, forms, galleries, checkout and archive blocks; organisms may compose other organisms. `components/seo/` contains JSON-LD rendering.
- `components/templates/` composes home, listing detail, checkout, editorial content and booking confirmation. Their data preparation lives in `modules/site/server/home.ts`, `modules/listings/server/detail.ts`, `modules/checkout/server/checkout.ts`, `modules/content/server/editorial.ts` and `modules/bookings/server/bookings.ts` respectively.
- `modules/` groups business rules by listings, bookings, checkout, payments, coupons, content, concierge and site. Booking date context lives in `modules/bookings/providers/BookingDates.tsx`, not in the visual hierarchy.
- `modules/listings/server/listings.ts` reads the catalogue and its taxonomy joins; `modules/content/server/content.ts` reads editorial pages, posts and site copy; `shared/media/server/media.ts` reads media. Pure category ordering, content descriptions and URL helpers do not depend on server queries.
- `shared/` contains utilities, UI class merging, media helpers, HTML/CSS sanitization and structured data. Server-specific files live under `server/`; existing `server-only` and `use client` boundaries are retained. Import client-safe helpers/types directly, not through mixed barrels.
- `infrastructure/data/local-client.ts` is a local JSON reader, not a Supabase connection. Its historical `publicSupabaseClient` / `hasPublicSupabaseConfig` names remain only to preserve the small internal query API without changing query behavior. JSON imports use `@/data`.
- Tests live in an area's `_test_/` folder. `vitest.config.mts` explicitly discovers those folders; `_test_/organization.test.ts` prevents misplaced tests and obsolete imports. Run `npm test`, `npx tsc --noEmit --incremental false` and `npm run lint` from this directory.
- Data stays in `data/`, images in `public/`, and tool/Docker/environment configuration remains at the project root. The Bitcoin provider and panel remain student stubs.

### Styling

Tailwind CSS 4 is loaded by `app/globals.css` through `@tailwindcss/postcss`.
Use complete utility classes in pages and components, including responsive and interaction variants; do not construct utility names from runtime values.
The global entry contains only design tokens, element defaults and animation keyframes.
Stored Gutenberg blocks receive static utilities in `shared/security/server/sanitize-html.ts`; dynamic images and editor preferences keep their runtime values.

## How data works

- The site does not connect to a database. `data/*.json` holds everything a visitor can see on the public site: pages, blog posts, listings with their prices, terms and the media index.
- `infrastructure/data/local-client.ts` gives the rest of the code a small query interface over those JSON files. It is read-only. Edits to the JSON files show up after a reload.
- Photos are in `public/media/`. A path such as `listings/casa-x/01.jpg` in the data is served at `/media/listings/casa-x/01.jpg`.
- Bookings are different: they are created while you use the site. They are kept in memory and saved to `.data/bookings.json`, so a dev restart keeps them. Delete that folder to reset all bookings.
- The public data has no guest data, no staff data and no keys.

## Secrets

Nothing in this repo is secret. You do not need to create `.env.local`. Do not add real API keys, wallet seeds or private data to this repo. If you need configuration, put it in `.env.local` (already gitignored) and never commit it.

## Notes

- This is Next.js 16. Read [AGENTS.md](./AGENTS.md) before you write code, and check `node_modules/next/dist/docs/` when unsure about an API.
- Photos, texts and the brand belong to Getaways El Salvador. See [LICENSE-NOTE.md](./LICENSE-NOTE.md).
