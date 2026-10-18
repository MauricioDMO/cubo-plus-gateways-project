import { describe, it, expect } from "vitest";
import { groupListingSections, isHtmlContent, parseListingContent } from "@/modules/listings/listing-content";

// Shape of the real migrated copy: prose, a "Heading:" line, then en-dash
// bullets. Newlines only — no <p>, no <br>.
const MIGRATED = [
  "Stay in this newly built 3-bedroom oceanfront apartment at Barefoot Surf & Sand in El Zonte.",
  "Designed with an open layout, the living room flows toward the ocean.",
  "Apartment Features:",
  "– Oceanfront master bedroom with en-suite closet",
  "– Junior bedroom with en-suite closet",
  "Perfect For:",
  "– Families",
].join("\n");

describe("parseListingContent", () => {
  it("groups consecutive prose lines into one paragraph", () => {
    const blocks = parseListingContent(MIGRATED);
    expect(blocks[0]).toEqual({
      type: "paragraph",
      text:
        "Stay in this newly built 3-bedroom oceanfront apartment at Barefoot Surf & Sand in El Zonte. " +
        "Designed with an open layout, the living room flows toward the ocean.",
    });
  });

  it("turns a trailing-colon line into a heading, without the colon", () => {
    const blocks = parseListingContent(MIGRATED);
    expect(blocks[1]).toEqual({ type: "heading", text: "Apartment Features" });
  });

  it("collects dash-prefixed lines into a single list", () => {
    const blocks = parseListingContent(MIGRATED);
    expect(blocks[2]).toEqual({
      type: "list",
      items: ["Oceanfront master bedroom with en-suite closet", "Junior bedroom with en-suite closet"],
    });
  });

  it("starts a new list after an intervening heading", () => {
    const blocks = parseListingContent(MIGRATED);
    expect(blocks[3]).toEqual({ type: "heading", text: "Perfect For" });
    expect(blocks[4]).toEqual({ type: "list", items: ["Families"] });
  });

  it("accepts en dash, em dash and hyphen bullets", () => {
    expect(parseListingContent("– one\n— two\n- three")).toEqual([
      { type: "list", items: ["one", "two", "three"] },
    ]);
  });

  // A long sentence ending in a colon is prose, not a section heading.
  it("does not treat a long colon-terminated sentence as a heading", () => {
    const long = "This apartment includes absolutely everything a family could possibly need for a long stay:";
    expect(parseListingContent(long)).toEqual([{ type: "paragraph", text: long }]);
  });

  it("returns nothing for empty or whitespace-only input", () => {
    expect(parseListingContent("")).toEqual([]);
    expect(parseListingContent("\n  \n")).toEqual([]);
  });
});

describe("isHtmlContent", () => {
  it("detects real markup so it keeps the HTML render path", () => {
    expect(isHtmlContent("<p>Hello</p>")).toBe(true);
    expect(isHtmlContent('<div class="x">Hi</div>')).toBe(true);
  });

  it("treats migrated plain text as not-HTML", () => {
    expect(isHtmlContent(MIGRATED)).toBe(false);
    expect(isHtmlContent("Ocean view & sun — 3 bedrooms")).toBe(false);
  });
});

describe("entities in the migrated copy", () => {
  it("decodes the ones the copy actually carries", () => {
    // "About 1 hour from San Salvador &amp; the Airport" printed exactly like
    // that on the Good Waves listing. These blocks are rendered by React as
    // text, which escapes them again, so decoding cannot introduce markup.
    const blocks = parseListingContent(
      ["About 1 hour from San Salvador &amp; the Airport", "Perfect For:", "- Couples &amp; friends"].join("\n")
    );
    expect(blocks[0]).toEqual({ type: "paragraph", text: "About 1 hour from San Salvador & the Airport" });
    expect(blocks[1]).toEqual({ type: "heading", text: "Perfect For" });
    expect(blocks[2]).toEqual({ type: "list", items: ["Couples & friends"] });
  });

  it("leaves an unknown entity alone rather than mangling it", () => {
    expect(parseListingContent("Caf&eacute; nearby")[0]).toEqual({ type: "paragraph", text: "Caf&eacute; nearby" });
  });
});

describe("groupListingSections", () => {
  /*
   * The split behind the property page's foldable description: the prose
   * before the first heading is always on screen, and everything under a
   * heading folds and starts folded.
   *
   * Template literals with real newlines, deliberately: the copy this parses
   * IS newline-separated plain text, and writing it that way here means the
   * fixture looks like what the database holds.
   */
  const blocks = parseListingContent(`Stay in this newly built oceanfront apartment.
Steps from the sand.
Apartment Features:
– Oceanfront master bedroom
– Junior bedroom
Building Amenities:
– Direct beach access`);

  it("keeps the prose before the first heading as the summary", () => {
    const { summary } = groupListingSections(blocks);
    expect(summary).toEqual([
      {
        type: "paragraph",
        text: "Stay in this newly built oceanfront apartment. Steps from the sand.",
      },
    ]);
  });

  it("makes one section per heading, carrying what follows it", () => {
    const { sections } = groupListingSections(blocks);
    expect(sections.map((section) => section.title)).toEqual([
      "Apartment Features",
      "Building Amenities",
    ]);
    expect(sections[0]!.blocks).toEqual([
      { type: "list", items: ["Oceanfront master bedroom", "Junior bedroom"] },
    ]);
    expect(sections[1]!.blocks).toEqual([{ type: "list", items: ["Direct beach access"] }]);
  });

  it("drops the colon, which belongs to the sentence and not to a control", () => {
    const { sections } = groupListingSections(parseListingContent(`Perfect For:
– Surfers`));
    expect(sections[0]!.title).toBe("Perfect For");
  });

  it("folds nothing when the copy has no headings", () => {
    const { summary, sections } = groupListingSections(
      parseListingContent("One paragraph and nothing else.")
    );
    expect(summary).toHaveLength(1);
    expect(sections).toEqual([]);
  });

  it("discards a heading with nothing under it", () => {
    // A control that opens onto an empty panel is worse than no control.
    const { sections } = groupListingSections(parseListingContent(`Amenities:
Perfect For:
– Surfers`));
    expect(sections.map((section) => section.title)).toEqual(["Perfect For"]);
  });

  it("survives copy that is nothing but headings", () => {
    const { summary, sections } = groupListingSections(parseListingContent(`One:
Two:`));
    expect(summary).toEqual([]);
    expect(sections).toEqual([]);
  });
});
