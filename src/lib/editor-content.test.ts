import { describe, expect, it } from "vitest";

import { hasEditorEnvelope, splitEditorContent } from "./editor-content";

const envelope = (html: string, css = ".gx-block{color:red}") =>
  `<!-- getaways:grapes eyJ2ZXJzaW9uIjoxfQ== -->\n<style>${css}</style>\n${html}`;

describe("splitEditorContent", () => {
  it("takes the project comment and the style block off the markup", () => {
    // The comment is the editor's saved project -- it stays in the database,
    // it just must never reach a reader.
    const { css, html } = splitEditorContent(envelope("<p>Hello</p>"));
    expect(html).toBe("<p>Hello</p>");
    expect(css).toBe(".gx-block{color:red}");
  });

  it("unwraps the <body> GrapesJS wraps its output in", () => {
    expect(splitEditorContent(envelope("<body><p>Hello</p></body>")).html).toBe("<p>Hello</p>");
  });

  it("is what stops a base64 blob rendering as a paragraph", () => {
    // The real shape of the Good Waves description: plain text typed into the
    // builder, so no <p> anywhere, wrapped in <body>. The listing page decides
    // between markup and plain text by looking for a <p>, so before this the
    // whole envelope failed that test and printed as the first paragraph.
    const stored = envelope("<body>Stay at Good Waves.\nPerfect For:\n- Couples</body>");
    const { html } = splitEditorContent(stored);
    expect(html).toBe("Stay at Good Waves.\nPerfect For:\n- Couples");
    expect(html).not.toContain("getaways:grapes");
    expect(html).not.toContain("<style");
    expect(html).not.toContain("body>");
  });

  it("leaves content that has no envelope exactly as it is", () => {
    const plain = "Stay in this newly built 3-bedroom oceanfront apartment.\nFeatures:\n- Pool";
    expect(splitEditorContent(plain)).toEqual({ css: "", html: plain });
    expect(splitEditorContent("<p>Written by hand</p>")).toEqual({ css: "", html: "<p>Written by hand</p>" });
  });

  it("does not swallow the content of a truncated comment", () => {
    // Cutting at indexOf(...) === -1 would take the whole string with it.
    const broken = "<!-- getaways:grapes eyJ2ZXJzaW9uIjoxfQ==\n<p>Still here</p>";
    expect(splitEditorContent(broken).html).toContain("Still here");
  });

  it("handles the two earlier builders' envelopes as well", () => {
    for (const prefix of ["<!-- getaways:builder ", "<!-- getaways:puck "]) {
      const stored = `${prefix}e30= -->\n<p>Old</p>`;
      expect(splitEditorContent(stored).html, prefix).toBe("<p>Old</p>");
      expect(hasEditorEnvelope(stored), prefix).toBe(true);
    }
  });

  it("survives null, undefined and empty", () => {
    expect(splitEditorContent(null)).toEqual({ css: "", html: "" });
    expect(splitEditorContent(undefined)).toEqual({ css: "", html: "" });
    expect(hasEditorEnvelope(null)).toBe(false);
  });
});
