import { expect, expectTypeOf, it } from "vitest";
import coupons from "@/data/coupons.json";
import listingTerms from "@/data/listing_terms.json";
import listings from "@/data/listings.json";
import media from "@/data/media.json";
import pages from "@/data/pages.json";
import postTerms from "@/data/post_terms.json";
import posts from "@/data/posts.json";
import terms from "@/data/terms.json";
import type {
  DataTables, ListingAttributes, ListingRow, MediaRow, PageStatus,
  PostStatus, Property, PropertyAttributes, StoredTaxonomy,
} from "@/data/types";
import type { CouponKind } from "@/modules/coupons/pricing";
import { TAXONOMIES } from "@/modules/content/taxonomies";
import { publicSupabaseClient } from "@/infrastructure/data/local-client";

// Imported JSON widens enum strings. Check the remaining shape statically and
// every enum value at runtime, including fields currently populated only by null.
const snapshots = {
  coupons, listing_terms: listingTerms, listings, media, pages,
  post_terms: postTerms, posts, terms,
} satisfies { [K in keyof DataTables]: Omit<DataTables[K], "status" | "taxonomy" | "kind">[] };

it("distinguishes native property attributes from stored strings", () => {
  const attributes = {
    bedrooms: 3, bathrooms: 2.5, guests: 6, parking: 2,
    price: 150, wifi: true, swimmingpool: false,
  } satisfies PropertyAttributes;
  expectTypeOf<Property["attributes"]>().toEqualTypeOf<PropertyAttributes>();
  expectTypeOf<PropertyAttributes["bathrooms"]>().toEqualTypeOf<number | undefined>();
  expectTypeOf<PropertyAttributes["bedrooms"]>().toEqualTypeOf<number | undefined>();
  expectTypeOf<PropertyAttributes["wifi"]>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<ListingAttributes["bathrooms"]>().toEqualTypeOf<string | undefined>();
  expect(attributes.bathrooms).toBe(2.5);
});

it("keeps all JSON snapshots compatible with their row contracts", () => {
  const pageStatuses: PageStatus[] = ["publish", "draft"];
  const postStatuses: PostStatus[] = ["published"];
  const couponKinds: CouponKind[] = ["percent", "amount"];
  const taxonomies: StoredTaxonomy[] = [
    ...TAXONOMIES.map((taxonomy) => taxonomy.key),
    "post_tag", "link_category", "nav_menu", "wp_theme", "hp_vendor_languages", "hp_vendor_services",
  ];
  expect(snapshots.pages.every((row) => pageStatuses.includes(row.status as PageStatus))).toBe(true);
  expect(snapshots.posts.every((row) => postStatuses.includes(row.status as PostStatus))).toBe(true);
  expect(snapshots.coupons.every((row) => couponKinds.includes(row.kind as CouponKind))).toBe(true);
  expect(snapshots.terms.every((row) => taxonomies.includes(row.taxonomy as StoredTaxonomy))).toBe(true);
  expect(snapshots.listings.every((row) =>
    Object.values(row.attributes).every((value) => typeof value === "string")
  )).toBe(true);
});

it("preserves typed rows, projected columns and nullable single results", async () => {
  const client = publicSupabaseClient();
  const full = await client.from("listings");
  expectTypeOf(full.data).toEqualTypeOf<ListingRow[] | null>();
  expect(full.data).toEqual(listings);

  const selected = await client.from("media").select(" id, storage_path ").order("id").range(0, 1);
  expectTypeOf(selected.data).toEqualTypeOf<Pick<MediaRow, "id" | "storage_path">[] | null>();
  const expected = [...media].sort((a, b) => a.id - b.id).slice(0, 2)
    .map(({ id, storage_path }) => ({ id, storage_path }));
  expect(selected).toEqual({ data: expected, error: null });

  const one = await client.from("media").select("id").eq("id", media[0].id).single();
  expectTypeOf(one.data).toEqualTypeOf<Pick<MediaRow, "id"> | null>();
  expect(one).toEqual({ data: { id: media[0].id }, error: null });
  const missing = client.from("media").select("id").eq("id", -1);
  expect(await missing.maybeSingle()).toEqual({ data: null, error: null });
  expect((await missing.single()).error?.code).toBe("PGRST116");
  expect((await client.from("media").single()).error?.code).toBe("PGRST116");
  expect((await client.from("media").select("id, relation(*)")).error).not.toBeNull();
});
