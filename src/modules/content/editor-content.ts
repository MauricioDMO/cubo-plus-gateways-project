/**
 * Splits content saved by the visual editor into its parts.
 *
 * A save from the builder is stored as three things in one column:
 *
 *     <!-- getaways:grapes <base64 project> -->
 *     <style>…</style>
 *     <the markup>
 *
 * The comment is the editor's own project data -- it is what lets the builder
 * reopen the page with its blocks and styles intact -- so it must stay in the
 * database. It just must never reach a reader.
 *
 * That is exactly what went wrong: the listing page decides between "real
 * markup" and "migrated plain text" by looking for a <p> or a <div>, and a
 * description typed as plain text into the builder has neither. So the whole
 * envelope failed that test and went down the plain-text path, which printed
 * the base64 blob and the CSS as the first paragraph of a live, bookable
 * property page.
 *
 * Everything that renders stored content goes through here first.
 */

const COMMENT_PREFIXES = [
  "<!-- getaways:grapes ",
  // Two earlier builders wrote their own envelopes. Rows from them still
  // exist, and their comments must be stripped for the same reason.
  "<!-- getaways:builder ",
  "<!-- getaways:puck ",
  // The ported Always El Salvador builder writes its own marker. A reader has
  // to be total about this: an envelope it does not recognise is a page that
  // prints base64 at the top, which is exactly the bug above.
  "<!-- always:grapes ",
];
const COMMENT_SUFFIX = " -->";

export type EditorContent = {
  /** The CSS the builder saved, without the <style> wrapper. */
  css: string;
  /** The markup, envelope removed and the <body> wrapper unwrapped. */
  html: string;
};

export function splitEditorContent(raw: string | null | undefined): EditorContent {
  const value = raw ?? "";
  const trimmed = value.trimStart();

  let html = value;
  const prefix = COMMENT_PREFIXES.find((candidate) => trimmed.startsWith(candidate));
  if (prefix) {
    const end = trimmed.indexOf(COMMENT_SUFFIX);
    // A truncated comment is left alone rather than half-removed: cutting at
    // an index of -1 would swallow the content.
    if (end > -1) html = trimmed.slice(end + COMMENT_SUFFIX.length).trimStart();
  }

  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/i, "").trim();

  /*
   * GrapesJS's getHtml() returns its wrapper as <body>…</body>. Nothing on
   * the page wants a body element inside a div: the sanitiser drops it (so a
   * post looked fine), but the plain-text path printed the closing tag as
   * visible text at the end of the description. Unwrapped here so both paths
   * see the same thing, and unwrapped again at save time so new rows do not
   * carry it at all.
   */
  const body = html.match(/^<body[^>]*>([\s\S]*)<\/body>$/i);
  if (body) html = body[1].trim();

  return { css: styleMatch?.[1] ?? "", html };
}

/** True when the value carries a visual-editor envelope. */
export function hasEditorEnvelope(raw: string | null | undefined): boolean {
  const trimmed = (raw ?? "").trimStart();
  return COMMENT_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

/*
 * The text of the widget's own placeholder heading.
 *
 * Dropping a heading block on the canvas writes "New heading" into it. Taking
 * that as a title gives you a post called "New heading" at
 * /travel/el-zonte/new-heading, so it does not count as copy.
 */
const HEADING_PLACEHOLDERS = new Set(["new heading", "title", "heading"]);

/** First heading in the body, if it is real copy and not the widget placeholder. */
export function firstHeadingText(raw: string | null | undefined): string {
  const { html } = splitEditorContent(raw);
  const match = html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  if (!match) return "";
  const text = match[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || HEADING_PLACEHOLDERS.has(text.toLowerCase())) return "";
  return text;
}
