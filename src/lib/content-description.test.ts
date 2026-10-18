import { describe, expect, it } from "vitest";
import { descriptionFromHtml } from "./content";

/*
 * All nine blog posts carried neither a seo_description nor an excerpt, so
 * every one of them fell through to the same generic site blurb -- nine pages
 * telling Google they are about the same thing.
 */
describe("descriptionFromHtml", () => {
  it("takes the opening prose out of a post body", () => {
    const html = "<p>El Zonte is a surf town an hour from the airport.</p><p>More.</p>";
    expect(descriptionFromHtml(html)).toBe("El Zonte is a surf town an hour from the airport. More.");
  });

  it("strips markup, entities and comments rather than leaking them into a result", () => {
    const html =
      '<!-- wp:paragraph --><p>Surf &amp; sun&nbsp;in&#8217;El Zonte, all year round, an hour from the airport.</p>';
    expect(descriptionFromHtml(html)).toBe(
      "Surf & sun in\u2019El Zonte, all year round, an hour from the airport."
    );
  });

  it("drops script and style content entirely", () => {
    const html = "<style>.a{color:red}</style><script>alert(1)</script><p>The waves at El Zonte break left and right all year.</p>";
    expect(descriptionFromHtml(html)).toBe("The waves at El Zonte break left and right all year.");
  });

  it("cuts at a sentence when one ends near the limit", () => {
    const html = `<p>${"A".repeat(100)}. ${"B".repeat(200)}</p>`;
    const out = descriptionFromHtml(html)!;
    expect(out.endsWith(".")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(155);
  });

  it("otherwise cuts on a word boundary, never mid-word", () => {
    const html = `<p>${Array.from({ length: 40 }, () => "sunshine").join(" ")}</p>`;
    const out = descriptionFromHtml(html)!;
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/sunshi…$/);
    expect(out.length).toBeLessThanOrEqual(156);
  });

  // Better no description than a two-word one: the caller falls back to
  // something written when this returns null.
  it("returns null when there is not enough text to describe anything", () => {
    expect(descriptionFromHtml("<p>Hi</p>")).toBeNull();
    expect(descriptionFromHtml("")).toBeNull();
    expect(descriptionFromHtml(null)).toBeNull();
    expect(descriptionFromHtml("<div><img src='x'></div>")).toBeNull();
  });
});
