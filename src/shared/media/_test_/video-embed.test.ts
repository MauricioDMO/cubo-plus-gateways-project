import { describe, it, expect } from "vitest";
import { hasEmbedVideoId, youtubeVideoId } from "@/shared/media/video-embed";

describe("youtubeVideoId", () => {
  it("takes the forms an editor actually pastes", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("keeps a bare id, which is what GrapesJS stores", () => {
    expect(youtubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("ignores the tracking and timestamp params YouTube appends when you copy a link", () => {
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ?si=xY1z&t=42")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&index=2")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("copes with a link pasted without its scheme", () => {
    expect(youtubeVideoId("youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null when there is no video to embed", () => {
    expect(youtubeVideoId("")).toBeNull();
    expect(youtubeVideoId(null)).toBeNull();
    // A listing with no video_url attribute at all: the section renders
    // nothing rather than an empty player.
    expect(youtubeVideoId(undefined)).toBeNull();
    expect(youtubeVideoId("   ")).toBeNull();
    expect(youtubeVideoId("https://vimeo.com/123456789")).toBeNull();
    expect(youtubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeVideoId("not a link")).toBeNull();
    expect(youtubeVideoId("https://www.youtube.com/")).toBeNull();
    // Right shape, wrong length -- not an id.
    expect(youtubeVideoId("https://www.youtube.com/watch?v=short")).toBeNull();
  });
});

describe("hasEmbedVideoId", () => {
  it("accepts a provider embed that names a video", () => {
    expect(hasEmbedVideoId("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0")).toBe(true);
    expect(hasEmbedVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(true);
    expect(hasEmbedVideoId("https://player.vimeo.com/video/123456789")).toBe(true);
  });

  it("rejects the empty embed GrapesJS emits for a Video block nobody filled in", () => {
    // Exactly what `ytncUrl + '' + '?'` produces.
    expect(hasEmbedVideoId("https://www.youtube-nocookie.com/embed/?")).toBe(false);
    expect(hasEmbedVideoId("https://www.youtube-nocookie.com/embed/")).toBe(false);
    expect(hasEmbedVideoId("https://www.youtube.com/embed/")).toBe(false);
    expect(hasEmbedVideoId("https://player.vimeo.com/video/")).toBe(false);
  });

  it("rejects an embed whose id is a pasted URL rather than an id", () => {
    expect(hasEmbedVideoId("https://www.youtube-nocookie.com/embed/https:/youtube.com/watch")).toBe(
      false
    );
  });

  it("does not enforce a shape on the id itself -- only that there is one", () => {
    // A hand-written embed, or a future id format, must survive. The host
    // allowlist is what makes <iframe> safe here; this guard is only about
    // empty players.
    expect(hasEmbedVideoId("https://www.youtube.com/embed/abc123")).toBe(true);
  });

  it("rejects a missing src", () => {
    expect(hasEmbedVideoId("")).toBe(false);
    expect(hasEmbedVideoId(null)).toBe(false);
  });

  it("leaves frames it does not recognise alone -- the host allowlist is a separate check", () => {
    expect(hasEmbedVideoId("https://example.com/anything")).toBe(true);
    expect(hasEmbedVideoId("https://www.youtube.com/some/other/path")).toBe(true);
  });
});
