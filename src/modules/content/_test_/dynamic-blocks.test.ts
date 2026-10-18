import { describe, expect, it } from "vitest";

import {
  BLOCK_BY_ID,
  blockAttr,
  blockCount,
  blockMarkup,
  DYNAMIC_BLOCKS,
  hasDynamicBlocks,
  splitDynamicBody,
} from "@/modules/content/dynamic-blocks";

const properties = BLOCK_BY_ID.get("properties")!;

describe("splitDynamicBody", () => {
  it("keeps the prose around a block, in order", () => {
    const parts = splitDynamicBody(
      `<p>Before</p><div data-gx-block="journal" data-count="2"></div><p>After</p>`
    );
    expect(parts.map((p) => p.kind)).toEqual(["html", "block", "html"]);
    expect(parts[0]).toMatchObject({ html: "<p>Before</p>" });
    expect(parts[2]).toMatchObject({ html: "<p>After</p>" });
  });

  it("reads the attributes off the marker", () => {
    const [part] = splitDynamicBody(`<div data-gx-block="properties" data-count="4" data-title="Stays"></div>`);
    expect(part).toMatchObject({ kind: "block" });
    if (part.kind !== "block") throw new Error("expected a block");
    expect(part.block.id).toBe("properties");
    expect(part.attrs.count).toBe("4");
    expect(part.attrs.title).toBe("Stays");
  });

  it("survives the placeholder the builder renders inside the marker", () => {
    // The builder leaves its label in there; it must not become page content.
    const parts = splitDynamicBody(blockMarkup(properties));
    expect(parts).toHaveLength(1);
    expect(parts[0].kind).toBe("block");
  });

  it("drops a marker for a block that no longer exists", () => {
    // Blocks get retired. A page written a year ago must not 500 over it, and
    // an empty div in its place would be a mystery gap.
    expect(splitDynamicBody(`<div data-gx-block="testimonials"></div>`)).toEqual([]);
  });

  it("handles several blocks in one body", () => {
    const html = `${blockMarkup(properties)}<p>Mid</p>${blockMarkup(BLOCK_BY_ID.get("journal")!)}`;
    expect(splitDynamicBody(html).map((p) => p.kind)).toEqual(["block", "html", "block"]);
  });

  it("returns plain markup untouched", () => {
    const parts = splitDynamicBody("<h2>Just words</h2>");
    expect(parts).toEqual([{ kind: "html", html: "<h2>Just words</h2>" }]);
  });

  it("ignores whitespace-only gaps between blocks", () => {
    const html = `${blockMarkup(properties)}\n\n${blockMarkup(properties)}`;
    expect(splitDynamicBody(html).every((p) => p.kind === "block")).toBe(true);
  });
});

describe("hasDynamicBlocks", () => {
  it("is the test for 'is this page composed in the builder'", () => {
    expect(hasDynamicBlocks("<p>nope</p>")).toBe(false);
    expect(hasDynamicBlocks(blockMarkup(properties))).toBe(true);
  });
});

describe("attributes", () => {
  it("falls back to the block's own default", () => {
    expect(blockAttr(properties, {}, "title")).toBe("Top Properties");
    expect(blockAttr(properties, { title: "  " }, "title")).toBe("Top Properties");
    expect(blockAttr(properties, { title: "Stays" }, "title")).toBe("Stays");
  });

  it("clamps a count, so a typo cannot ask for nine hundred cards", () => {
    expect(blockCount(properties, { count: "4" })).toBe(4);
    expect(blockCount(properties, { count: "900" })).toBe(24);
    expect(blockCount(properties, { count: "0" })).toBe(6);
    expect(blockCount(properties, { count: "abc" })).toBe(6);
    expect(blockCount(properties, {})).toBe(6);
  });
});

describe("the registry", () => {
  it("has no duplicate ids", () => {
    const ids = DYNAMIC_BLOCKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("round-trips every block's own markup", () => {
    // The editor inserts blockMarkup and the renderer parses it. If those two
    // ever disagree the block silently becomes an empty div on the page.
    for (const block of DYNAMIC_BLOCKS) {
      const parts = splitDynamicBody(blockMarkup(block));
      expect(parts, block.id).toHaveLength(1);
      expect(parts[0], block.id).toMatchObject({ kind: "block" });
      if (parts[0].kind !== "block") continue;
      expect(parts[0].block.id, block.id).toBe(block.id);
      for (const attr of block.attrs) {
        expect(parts[0].attrs[attr.name], `${block.id}.${attr.name}`).toBe(attr.default);
      }
    }
  });
});
