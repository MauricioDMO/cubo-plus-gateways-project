/**
 * Listing descriptions arrive from the migration as PLAIN TEXT, not HTML:
 * `content_html` for a listing contains no <p>, no <br> and no <ul> — just
 * newline-separated lines. (The live WordPress site does have real <p>
 * elements; the extractor dropped them.)
 *
 * That was previously papered over with `white-space: pre-line` on the
 * rendering element, which made the newlines visible but produced no real
 * structure — and broke outright the moment that declaration was removed,
 * collapsing the whole description into one wall of text.
 *
 * So the text is parsed into blocks here instead. The copy follows a
 * consistent shape across every listing:
 *
 *     Stay in this newly built 3-bedroom oceanfront apartment…
 *     Apartment Features:
 *     – Oceanfront master bedroom with en-suite closet and full bathroom
 *     – Junior bedroom with en-suite closet and full bathroom
 *     Building Amenities:
 *     – Direct beach access
 *
 * i.e. prose paragraphs, "Heading:" lines, and dash-prefixed bullets. Those
 * become <p>, <h3> and <ul><li> respectively, which is what the live site's
 * markup amounts to and reads better than its <br>-separated runs.
 */

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

// A bullet may be introduced by an en dash, em dash or hyphen, optionally
// after leading whitespace. The migrated copy uses "–" (en dash).
const BULLET = /^\s*[–—-]\s+/;

// A heading is a short line ending in a colon that is not itself a bullet,
// e.g. "Apartment Features:", "Building Amenities:", "Perfect For:".
// Length-capped so a long sentence that happens to end in a colon stays prose.
const HEADING = /^[^–—-].{0,60}:\s*$/;

/** True when the value looks like real markup rather than migrated plain text. */
export function isHtmlContent(raw: string): boolean {
  return /<(p|div|ul|ol|h[1-6]|section|article)[\s>]/i.test(raw);
}

/*
 * The copy is plain text, but some of it was typed into an HTML editor, so a
 * line can carry an entity: "San Salvador &amp; the Airport" printed exactly
 * like that on the Good Waves listing. Decoded here because these blocks are
 * rendered by React as text -- it escapes them again on the way out, so
 * decoding cannot introduce markup.
 *
 * Only the five that appear in this copy, plus &nbsp;. A general-purpose
 * entity decoder is a dependency and a surface area this does not need.
 */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity);
}

export function parseListingContent(raw: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let list: string[] = [];
  let paragraph: string[] = [];

  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "list", items: list.map(decodeEntities) });
      list = [];
    }
  };
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: decodeEntities(paragraph.join(" ")) });
      paragraph = [];
    }
  };

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (BULLET.test(trimmed)) {
      flushParagraph();
      const item = trimmed.replace(BULLET, "").trim();
      if (item) list.push(item);
      continue;
    }

    flushList();

    if (HEADING.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "heading", text: decodeEntities(trimmed.replace(/:\s*$/, "")) });
      continue;
    }

    // Consecutive prose lines are one paragraph: the source wraps mid-sentence,
    // so treating each line as its own paragraph would shred the copy.
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
}

/**
 * The description, split into the part that is always on screen and the parts
 * a guest opens.
 *
 * The copy has one shape across every listing: prose first, then a run of
 * "Heading:" lines each followed by its own bullets. So the prose before the
 * first heading is the summary -- always visible, with no control to hide it,
 * because a property page whose description starts closed says nothing about
 * the property. Everything from a heading up to the next one becomes a section
 * that starts closed.
 *
 * A listing with no headings at all yields a summary and no sections, which is
 * the right answer rather than a special case: there is nothing to fold.
 */
export type ListingSection = { title: string; blocks: ContentBlock[] };

export function groupListingSections(blocks: ContentBlock[]): {
  summary: ContentBlock[];
  sections: ListingSection[];
} {
  const summary: ContentBlock[] = [];
  const sections: ListingSection[] = [];

  for (const block of blocks) {
    if (block.type === "heading") {
      // The colon belongs to the sentence the copy was typed as; on a control
      // that opens and closes it reads as a stray character.
      sections.push({ title: block.text.replace(/\s*:\s*$/, ""), blocks: [] });
      continue;
    }
    if (sections.length === 0) {
      summary.push(block);
      continue;
    }
    sections[sections.length - 1]!.blocks.push(block);
  }

  // A heading with nothing under it is a control that opens onto nothing.
  return { summary, sections: sections.filter((section) => section.blocks.length > 0) };
}
