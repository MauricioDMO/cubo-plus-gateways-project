import { expect, it } from "vitest";
import { getHomeData } from "@/modules/site/server/home";
import { getListingDetailData } from "@/modules/listings/server/detail";
import { getAllListings } from "@/modules/listings/server/listings";
import { getAllPosts } from "@/modules/content/server/content";
import { getEditorialData } from "@/modules/content/server/editorial";
import { getCheckoutData } from "@/modules/checkout/server/checkout";
import { blogPostPath } from "@/modules/content/paths";

it("prepares the existing catalogue/editorial pages and rejects missing checkout sessions", async () => {
  const [home, listings, posts] = await Promise.all([getHomeData(), getAllListings(), getAllPosts()]);
  expect(home.listings.length).toBeGreaterThan(0);
  expect(home.posts.map((post) => post.id)).toEqual(posts.slice(0, 3).map((post) => post.id));
  expect(home.destinations.reduce((sum, destination) => sum + destination.count, 0)).toBe(listings.length);
  expect(home.maxGuests).toBe(Math.max(...listings.map((listing) => Number(listing.attributes?.guests) || 0)));

  const detail = await getListingDetailData(listings[0].slug);
  expect(detail?.listing.id).toBe(listings[0].id);
  expect(detail?.tourPhotoCount).toBe(detail?.tourGroups.reduce((sum, group) => sum + group.media.length, 0));
  expect(detail?.relatedListings.every((listing) => listing.id !== detail.listing.id)).toBe(true);
  expect(await getListingDetailData("__missing_listing__")).toBeNull();

  const contact = await getEditorialData(["contact-us"]);
  expect(contact?.kind).toBe("page");
  expect(contact?.isContact).toBe(true);
  const post = posts[0];
  const path = blogPostPath(post.published_at, post.slug);
  const editorial = await getEditorialData(path.slice(1).split("/"));
  expect(editorial?.kind).toBe("post");
  expect(editorial?.path).toBe(path);
  expect(editorial?.title).toBe(post.title);
  expect(editorial?.article?.["@type"]).toBe("BlogPosting");
  expect(await getEditorialData(["2026", "02", "31", post.slug])).toBeNull();
  expect(await getEditorialData(["invalid", "route"])).toBeNull();
  expect(await getCheckoutData(undefined)).toBeNull();
  expect(await getCheckoutData("invalid-session")).toBeNull();
});
