/*
 * Live sections you can drop into the visual builder.
 *
 * The builder could always place text and photographs. What it could not
 * place is anything that reads the database -- the property carousel, the
 * search bar, the journal -- which is exactly why the homepage had to stay
 * hand-built and out of reach. A page composed in the builder was a leaflet;
 * the parts of the site people actually come for were welded into React.
 *
 * A dynamic block is a marker in the stored markup:
 *
 *     <div data-gx-block="properties" data-count="6"></div>
 *
 * In the builder it is a labelled placeholder you can drag, order and delete.
 * On the public site DynamicBody swaps each marker for the real section,
 * rendered on the server from live data. The markup between markers is
 * ordinary builder output and still goes through the sanitiser.
 *
 * WHY A MARKER AND NOT A SHORTCODE
 *
 * `[properties count=6]` in a paragraph would be simpler to write and worse
 * everywhere else: the builder would treat it as text a writer can break by
 * typing in the middle of it, it has no visible boundary on the canvas, and
 * it cannot carry a "do not edit inside this" flag. A div with data
 * attributes is a real element -- GrapesJS gives it a drag handle and a
 * settings panel for free, and the attributes survive the round trip through
 * getHtml/setComponents that a bare string does not.
 */

export type BlockAttrKind = "number" | "text";

export type BlockAttr = {
  name: string;
  kind: BlockAttrKind;
  label: string;
  default: string;
  hint?: string;
};

export type DynamicBlock = {
  id: string;
  label: string;
  /** One line, shown in the builder's widget rail and on the placeholder. */
  description: string;
  attrs: BlockAttr[];
};

export const DYNAMIC_BLOCKS: DynamicBlock[] = [
  {
    id: "search",
    label: "Search bar",
    description: "Dates, guests and destination, wired to the live catalogue.",
    attrs: [],
  },
  {
    id: "properties",
    label: "Properties",
    description: "A carousel of properties, priced and linked from the database.",
    attrs: [
      { name: "count", kind: "number", label: "How many", default: "6" },
      { name: "title", kind: "text", label: "Heading", default: "Top Properties" },
      {
        name: "subtitle",
        kind: "text",
        label: "Subheading",
        default: "Oceanfront favorites ready for your next stay.",
      },
    ],
  },
  {
    id: "journal",
    label: "Journal",
    description: "The most recent posts, as cards.",
    attrs: [
      { name: "count", kind: "number", label: "How many", default: "3" },
      { name: "title", kind: "text", label: "Heading", default: "From the Journal" },
      {
        name: "subtitle",
        kind: "text",
        label: "Subheading",
        default: "Guides and stories from the coast, written by the people who live on it.",
      },
    ],
  },
];

export const BLOCK_BY_ID = new Map(DYNAMIC_BLOCKS.map((block) => [block.id, block]));

/** The attribute a marker carries its type in. */
export const BLOCK_ATTR = "data-gx-block";

/* ----------------------------------------------------------------- parsing */

export type BodyPart =
  | { kind: "html"; html: string }
  | { kind: "block"; block: DynamicBlock; attrs: Record<string, string> };

/*
 * One marker.
 *
 * Non-greedy to the first `</div>`, which is why the placeholder the builder
 * renders inside a marker must not itself contain a div -- it uses spans. A
 * nested div would end the match early and leave a stray `</div>` in the
 * markup, and the sanitiser would then drop it silently.
 */
const MARKER = new RegExp(`<div([^>]*\\b${BLOCK_ATTR}=["'][^"']+["'][^>]*)>[\\s\\S]*?<\\/div>`, "gi");

function readAttrs(rawTag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const attr = /([a-zA-Z-]+)\s*=\s*["']([^"']*)["']/g;
  let match: RegExpExecArray | null;
  while ((match = attr.exec(rawTag))) {
    const [, name, value] = match;
    if (!name.startsWith("data-")) continue;
    out[name.slice("data-".length)] = value;
  }
  return out;
}

/**
 * Splits stored markup into ordinary HTML and the live blocks between it.
 *
 * Total on purpose: a marker naming a block that no longer exists is dropped
 * rather than rendered as an empty div or thrown over. Blocks get removed
 * from the registry when a section is retired, and a page written a year ago
 * must not 500 because of it.
 */
export function splitDynamicBody(html: string): BodyPart[] {
  const parts: BodyPart[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  MARKER.lastIndex = 0;
  while ((match = MARKER.exec(html))) {
    const before = html.slice(cursor, match.index);
    if (before.trim()) parts.push({ kind: "html", html: before });

    const attrs = readAttrs(match[1]);
    const block = BLOCK_BY_ID.get(attrs[BLOCK_ATTR.slice("data-".length)] ?? "");
    if (block) {
      parts.push({ kind: "block", block, attrs });
    }
    cursor = match.index + match[0].length;
  }

  const rest = html.slice(cursor);
  if (rest.trim()) parts.push({ kind: "html", html: rest });
  return parts;
}

/** True when the markup places at least one live section. */
export function hasDynamicBlocks(html: string): boolean {
  return splitDynamicBody(html).some((part) => part.kind === "block");
}

/** An attribute's value, or the block's own default. */
export function blockAttr(
  block: DynamicBlock,
  attrs: Record<string, string>,
  name: string
): string {
  const declared = block.attrs.find((attr) => attr.name === name);
  const raw = attrs[name];
  if (raw != null && raw.trim() !== "") return raw.trim();
  return declared?.default ?? "";
}

/** An attribute read as a count, clamped so a typo cannot ask for 900 cards. */
export function blockCount(
  block: DynamicBlock,
  attrs: Record<string, string>,
  name = "count",
  max = 24
): number {
  const value = Number.parseInt(blockAttr(block, attrs, name), 10);
  if (!Number.isFinite(value) || value < 1) {
    return Number.parseInt(block.attrs.find((a) => a.name === name)?.default ?? "1", 10) || 1;
  }
  return Math.min(value, max);
}

/** The markup a builder block inserts. Shared so editor and parser agree. */
export function blockMarkup(block: DynamicBlock): string {
  const attrs = block.attrs.map((attr) => ` data-${attr.name}="${attr.default}"`).join("");
  return (
    `<div ${BLOCK_ATTR}="${block.id}"${attrs} class="gx-block">` +
    `<span class="gx-block__label">${block.label}</span>` +
    `<span class="gx-block__hint">${block.description}</span>` +
    `</div>`
  );
}
