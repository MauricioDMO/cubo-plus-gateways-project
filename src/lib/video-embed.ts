/*
 * Video embed helpers, shared by the visual builder (client) and the HTML
 * sanitizer (server).
 *
 * Two problems this solves, both from the same root: GrapesJS's video
 * component stores a bare *id*, not a URL, and builds the embed src by string
 * concatenation -- `ytncUrl + videoId + '?'`.
 *
 *   1. With no id, that produces "https://www.youtube-nocookie.com/embed/?".
 *      The host is on the sanitizer's allowlist, so a Video block dropped on
 *      a page and never filled in shipped to the live site as a blank player.
 *      hasEmbedVideoId() is the guard: no id, no iframe.
 *
 *   2. An editor pastes the link they have -- youtube.com/watch?v=… or a
 *      youtu.be short link -- into a field labelled "Video ID". GrapesJS
 *      concatenates it verbatim, producing ".../embed/https://youtube.com/…".
 *      youtubeVideoId() pulls the id out of any of the forms YouTube hands
 *      out, so pasting the link is the thing that works.
 */

/** YouTube ids are 11 chars of the URL-safe base64 alphabet. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/**
 * Extracts the video id from anything an editor is likely to paste: a watch
 * URL, a youtu.be short link, a /embed/ or /shorts/ URL, or an id on its own.
 * Returns null when there is no id to find, which is the signal to render
 * nothing rather than an empty player.
 */
export function youtubeVideoId(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (YOUTUBE_ID.test(raw)) return raw;

  // A pasted link may arrive without a scheme ("youtu.be/abc"), which URL
  // rejects outright.
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" || host === "www.youtu.be") {
    return YOUTUBE_ID.test(segments[0] ?? "") ? segments[0] : null;
  }

  if (!YOUTUBE_HOSTS.has(host)) return null;

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && YOUTUBE_ID.test(fromQuery)) return fromQuery;

  // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
  if (segments.length >= 2 && ["embed", "shorts", "live", "v"].includes(segments[0])) {
    return YOUTUBE_ID.test(segments[1]) ? segments[1] : null;
  }

  return null;
}

/**
 * A path segment that could be a video id: non-empty, and not something that
 * only got there because a whole URL was concatenated in.
 *
 * Deliberately looser than YOUTUBE_ID. The question this guard asks is "is
 * there an id here at all", not "is this a well-formed YouTube id" -- an
 * embed hand-written in the HTML view, or a future id format, should not be
 * deleted for failing a shape test we invented.
 */
const PLAUSIBLE_ID = /^[A-Za-z0-9_-]+$/;

/**
 * True when an iframe src is a provider embed that actually names a video.
 *
 * Anything that is not a recognised embed URL returns true: this is not the
 * host allowlist (sanitize-html enforces that separately), and it must not
 * silently swallow a frame it simply does not understand.
 */
export function hasEmbedVideoId(src: string | null | undefined): boolean {
  const raw = (src ?? "").trim();
  if (!raw) return false;

  let url: URL;
  try {
    url = new URL(raw, "https://placeholder.invalid");
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.has(host)) {
    // .../embed/<id> -- the id is the segment after "embed", and an empty
    // videoId leaves nothing there at all.
    if (segments[0] !== "embed") return true;
    return PLAUSIBLE_ID.test(segments[1] ?? "");
  }

  if (host === "player.vimeo.com") {
    if (segments[0] !== "video") return true;
    return PLAUSIBLE_ID.test(segments[1] ?? "");
  }

  return true;
}
