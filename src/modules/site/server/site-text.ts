import "server-only";

import { cache, type CSSProperties } from "react";

import { getAllListings, getListingCategoriesWithCounts } from "@/modules/listings/server/listings";
import { getMediaByIds } from "@/shared/media/server/media";
import { getSiteContent } from "@/modules/content/server/content";
import { visibleListingCategories } from "@/modules/listings/categories";
import { collectDestinations } from "@/modules/listings/locations";
import { mediaPublicUrl } from "@/shared/media/media";
import { sanitizeInlineHtml } from "@/shared/security/server/sanitize-html";
import {
  ALL_SLOTS,
  applyTokens,
  focusProps,
  isCompleteItem,
  lookProps,
  mediaInUse,
  slotById,
  slotList,
  usesTokens,
  type ListItem,
  type SiteContent,
  type TokenValues,
} from "@/modules/content/site-content";

/*
 * Read-only access to the published site copy.
 *
 *     const c = await siteText();
 *     <h1 {...c.edit("blog.title", "Journal heading")}>{c.text("blog.title")}</h1>
 *
 * The student copy has no editor, so visitors always get the published
 * content. `edit()` only returns how a slot looks (alignment, size, class),
 * and `editItem()` / `editField()` return nothing.
 */

export type RenderState = { content: SiteContent };

/** What the page renders from: the published copy from data/*.json. */
export const getRenderState = cache(async (): Promise<RenderState> => ({ content: await getSiteContent() }));

/**
 * The two tokens, worked out only if something actually uses one.
 * Lazy: no token in the string, no catalogue read.
 */
const resolveTokens = cache(async (): Promise<TokenValues> => {
  const [listings, categories] = await Promise.all([getAllListings(), getListingCategoriesWithCounts()]);
  const towns = collectDestinations(listings)
    .map((destination) => destination.label.split(",")[0]?.trim())
    .filter(Boolean);
  const visible = visibleListingCategories(categories);
  return {
    stays:
      visible.length > 0
        ? visible.map((category) => category.name.toLowerCase()).join(" and ")
        : "vacation rentals",
    towns:
      towns.length > 1
        ? `${towns.slice(0, -1).join(", ")} and ${towns[towns.length - 1]}`
        : (towns[0] ?? "El Salvador"),
  };
});

export type SiteImage = { url: string; mediaId: number; alt: string };

/** Every photograph the content can show, fetched together, once per request. */
const imagesInUse = cache(async (): Promise<Map<number, SiteImage>> => {
  const { content } = await getRenderState();
  const ids = [...new Set([...mediaInUse(content), ...mediaInUse({})].map((use) => use.id))];
  const rows = ids.length > 0 ? await getMediaByIds(ids) : [];
  return new Map(
    rows.map((row) => [row.id, { url: mediaPublicUrl(row.storage_path), mediaId: row.id, alt: row.alt_text ?? "" }])
  );
});

/** Look props for a slot: a class and/or inline style. */
export type SlotProps = { className?: string; style?: CSSProperties };

export type SlotKind = "text" | "image" | "link" | "rich" | string;

export type SiteText = {
  /** The words for a slot: what was set, else the page's derived default, else the slot's own. */
  text: (id: string, derived?: string) => string;
  /** A rich-text slot's HTML, sanitized, for dangerouslySetInnerHTML. */
  rich: (id: string) => string;
  /** An image slot's photo: what was set, else its default. Needs `images: true`. */
  image: (id: string) => SiteImage | null;
  /** The photo for a media id held in a list item. Needs `images: true`. */
  media: (mediaId: string | undefined) => SiteImage | null;
  /** A list slot's items. Visitors only get complete ones. */
  list: (id: string) => ListItem[];
  /** How a slot looks (alignment, size, class). */
  edit: (id: string, label: string, kind?: SlotKind, options?: { className?: string; [key: string]: unknown }) => SlotProps;
  /** Where a photo sits in its frame, on computers and phones (keys are image slot @focus keys). */
  focus: (desktopKey: string, mobileKey: string, options?: { background?: boolean; className?: string }) => SlotProps;
  /** Kept for call-site compatibility. Returns nothing: there is no editor. */
  editItem: (listId: string, itemId: string) => Record<string, string>;
  /** Kept for call-site compatibility. Returns nothing: there is no editor. */
  editField: (listId: string, itemId: string, field: string, label: string, kind?: SlotKind, options?: object) => Record<string, string>;
  content: SiteContent;
};

export async function siteText(options: { images?: boolean } = {}): Promise<SiteText> {
  const { content } = await getRenderState();

  const raw = (id: string) => content[id] ?? slotById(id)?.fallback ?? "";

  // One pass to see whether any value on this page needs the catalogue.
  const needsTokens = ALL_SLOTS.some((slot) => usesTokens(raw(slot.id)));
  const tokens = needsTokens ? await resolveTokens() : { stays: "", towns: "" };
  const images = options.images ? await imagesInUse() : new Map<number, SiteImage>();

  const byMediaId = (value: string | number | undefined | null): SiteImage | null => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? (images.get(id) ?? null) : null;
  };

  return {
    text: (id, derived) => {
      const value = content[id] ?? derived ?? slotById(id)?.fallback ?? "";
      return usesTokens(value) ? applyTokens(value, tokens) : value;
    },
    rich: (id) => sanitizeInlineHtml(raw(id)),
    image: (id) => byMediaId(content[id]) ?? byMediaId(slotById(id)?.fallbackMediaId),
    media: (mediaId) => byMediaId(mediaId),
    list: (id) => {
      const slot = slotById(id);
      if (!slot?.item) return [];
      return slotList(content, slot).filter((item) => isCompleteItem(item, slot.item!));
    },
    edit: (id, _label, kind = "text", { className } = {}) => {
      const look = kind === "image" ? { className } : lookProps(content, id, className);
      return {
        ...(look.className ? { className: look.className } : {}),
        ...("style" in look && look.style ? { style: look.style as CSSProperties } : {}),
      };
    },
    focus: (desktopKey, mobileKey, { background = false, className } = {}) => {
      const look = focusProps(content[desktopKey], content[mobileKey], background, className);
      return {
        ...(look.className ? { className: look.className } : {}),
        ...(look.style ? { style: look.style as CSSProperties } : {}),
      };
    },
    editItem: () => ({}),
    editField: () => ({}),
    content,
  };
}
