# Fuentes y tipos de datos

Los contratos de los ocho snapshots están en [`types.ts`](./types.ts).
Representan las filas almacenadas, no los modelos enriquecidos con imágenes,
categorías o precios calculados que devuelven los módulos.

| Archivo | Tipo | Registros actuales |
| --- | --- | ---: |
| `coupons.json` | `CouponRow` | 1 |
| `listing_terms.json` | `ListingTermRow` | 20 |
| `listings.json` | `ListingRow` | 11 |
| `media.json` | `MediaRow` | 321 |
| `pages.json` | `PageRow` | 3 |
| `post_terms.json` | `PostTermRow` | 70 |
| `posts.json` | `PostRow` | 9 |
| `terms.json` | `TermRow` | 53 |

## Definir una propiedad

`PropertyAttributes` usa números para capacidades, precios y horarios, booleanos
para servicios y los tipos existentes para galerías y reseñas. Todos sus campos
son opcionales: un dato desconocido no se confunde con cero o `false`.

```ts
import type { PropertyAttributes } from "@/data/types";

const attributes: PropertyAttributes = {
  bedrooms: 3,
  bathrooms: 2.5,
  guests: 6,
  parking: 2,
  price: 150,
  wifi: true,
  airconditioning: true,
  swimmingpool: true,
};
```

`Property` representa la propiedad completa con estos atributos. `ListingRow`
y `ListingAttributes` conservan el formato de los JSON; declarar un tipo no
convierte automáticamente sus textos a números o booleanos.

- Los identificadores son números; las fechas se conservan como texto.
- `ListingAttributes` contiene campos opcionales de texto: también precios,
  cantidades, indicadores y horarios en segundos desde medianoche.
  `gallery_groups` y `reviews` son JSON serializado, no objetos ya decodificados.
- SEO, texto alternativo y referencias opcionales admiten `null`.
  Los campos de cupón y `parent_id` no son de tipo `null` exclusivamente aunque
  el snapshot actual solo contenga valores nulos en ellos.
- Las páginas usan `publish`/`draft`; los posts usan `published`.
  `StoredTaxonomy` incluye las nueve taxonomías migradas, no solo las tres públicas.
- Los posts no contienen `updated_at`.

## Otras fuentes revisadas

Se reutilizan sus contratos existentes, sin duplicarlos:

| Fuente | Contrato |
| --- | --- |
| Reservas en `.data/bookings.json` | `Booking`, `BookingStatus`, `NewBooking` en `modules/bookings/server/booking-store.ts` |
| Pagos mock en memoria | `PaymentSession`, `PaymentProvider` en `modules/payments/types.ts` |
| Formulario concierge, sin backend | `ConciergeRequest` en `modules/concierge/concierge-shared.ts` |
| Contenido configurable y listas serializadas | `SiteContent`, `ListItem` en `modules/content/site-content.ts` |
| Galerías y reseñas decodificadas | `GalleryGroups` en `modules/listings/listing-gallery-groups.ts`; `ListingReview` en `modules/listings/listing-reviews.ts` |

El cliente local conserva el tipo de tabla y de las columnas seleccionadas.
Las pruebas de `_test_/data-types.test.ts` comprueban los snapshots y las consultas;
`tsc --noEmit` comprueba sus contratos estáticos.
