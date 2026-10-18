import { describe, expect, it } from "vitest";
import { sanitizeCss, sanitizeContentHtml } from "@/shared/security/server/sanitize-html";

/*
 * The filter used to run one pass, so deleting a match could join what sat on
 * either side of it into a new one. Proven before the fix: the payload below
 * put a live onerror handler into the output, past sanitize-html entirely.
 */
describe("sanitizeCss reconstruction", () => {
  it("does not let a split closing tag rebuild itself", () => {
    expect(sanitizeCss("a{}<</style/style>")).not.toContain("</style");
    expect(sanitizeCss("a{}<<</style/style>/style>")).not.toContain("</style");
  });

  it("keeps stripping the other patterns until they stop reappearing", () => {
    expect(sanitizeCss("javascjavascript:ript:red")).not.toMatch(/javascript\s*:/i);
    expect(sanitizeCss("expressexpression(ion(1)")).not.toMatch(/expression\s*\(/i);
    expect(sanitizeCss("behabehavior:vior:url(x)")).not.toMatch(/behavior\s*:/i);
  });

  it("still removes what it always removed, in one pass", () => {
    expect(sanitizeCss('@import url("evil.css"); a{color:red}')).not.toContain("@import");
    expect(sanitizeCss("a{background:url(https://evil.example/x)}")).toContain("none");
    expect(sanitizeCss("a{color:red}")).toBe("a{color:red}");
  });

  it("leaves ordinary CSS alone, including range syntax that uses <", () => {
    const css = "@media (400px < width < 700px) { a { color: red } }";
    expect(sanitizeCss(css)).toBe(css);
  });
});

describe("style block cannot break out of its own tag", () => {
  /*
   * What matters is not whether the string "onerror" survives -- inside a
   * <style> element it is inert text, because style is a raw-text element
   * whose content ends only at a literal </style. What matters is that no
   * element ESCAPES the block.
   *
   * Confirmed against a real HTML parser: before the fix the payload below
   * parsed to STYLE,IMG,P with one live <img>; after it, to STYLE,P with
   * zero. So the assertion here is the absence of a closing tag inside the
   * style content, which is the only thing that can end it early.
   */
  function styleContent(output: string): string {
    return output.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] ?? "";
  }

  it("leaves nothing in the style block that could close it", () => {
    const out = sanitizeContentHtml(
      '<style>a{}<</style/style><img src=x onerror="alert(1)"></style><p>hi</p>'
    );
    expect(styleContent(out)).not.toMatch(/<\/\s*style/i);
    // The rest of the document still comes through: the fix contains the
    // payload, it does not throw the page away.
    expect(out).toContain("hi");
  });

  it("holds when the payload is nested deeper", () => {
    const out = sanitizeContentHtml(
      '<style>a{}<<</style/style>/style><img src=x onerror="alert(1)"></style>'
    );
    expect(styleContent(out)).not.toMatch(/<\/\s*style/i);
  });

  it("emits exactly one style element, so nothing sits outside it unsanitized", () => {
    const out = sanitizeContentHtml(
      '<style>a{}<</style/style><img src=x onerror="alert(1)"></style><p>hi</p>'
    );
    expect((out.match(/<style/gi) ?? []).length).toBe(1);
    expect((out.match(/<\/style>/gi) ?? []).length).toBe(1);
  });
});

/*
 * CSS escapes are decoded by the browser long after this filter runs, so an
 * escape was a way past every literal-ASCII pattern in it. All four of these
 * were confirmed working in a real browser before the fix: the first three
 * resolved to https://example.com/... and the last parsed as a live
 * CSSImportRule.
 */
describe("escape-obfuscated payloads", () => {
  it("catches an off-origin url hidden behind hex escapes", () => {
    expect(sanitizeCss(String.raw`a{background:url(\2f \2f evil.com/leak.png)}`)).not.toContain("evil.com");
  });

  it("catches one hidden behind escaped solidi", () => {
    expect(sanitizeCss(String.raw`a{background:url(\/\/evil.com/leak.png)}`)).not.toContain("evil.com");
  });

  it("catches a url left unterminated at the end of the stylesheet", () => {
    // No closing paren. Browsers recover and fetch it anyway.
    expect(sanitizeCss("a{background:url(//evil.com/leak.png")).not.toContain("evil.com");
  });

  it("catches an @import whose at-keyword is escaped", () => {
    const out = sanitizeCss(String.raw`@\69 mport url("//evil.com/x.css");`);
    expect(out).not.toContain("evil.com");
    expect(out).not.toMatch(/@\s*import/i);
  });

  it("catches an escaped javascript: scheme", () => {
    expect(sanitizeCss(String.raw`a{background:\6a avascript:x}`)).not.toMatch(/javascript\s*:/i);
  });

  /*
   * Only escapes that produce a character these patterns use are decoded.
   * `\A` is a newline and `\201C` a curly quote; turning either into a literal
   * character inside a string would change what the rule means, so they are
   * left exactly as written.
   */
  it("leaves escapes alone when decoding them would change the CSS", () => {
    expect(sanitizeCss(String.raw`a::after{content:"\A"}`)).toBe(String.raw`a::after{content:"\A"}`);
    expect(sanitizeCss(String.raw`a::after{content:"\201C"}`)).toBe(String.raw`a::after{content:"\201C"}`);
  });

  it("still keeps the relative and data: urls a real layout needs", () => {
    expect(sanitizeCss("a{background:url(/img/x.png)}")).toContain("/img/x.png");
    expect(sanitizeCss("a{background:url(data:image/gif;base64,R0lGOD)}")).toContain("data:image");
  });
});
