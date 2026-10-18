import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { slotById, slotKindFor } from "@/modules/content/site-content";

/*
 * Every slot id written into a page exists in the registry.
 *
 * A typo'd id is not a crash -- the page renders an empty string, and the
 * editor saves to a key the server then refuses -- which is exactly the kind
 * of mistake that ships. This reads the source for literal ids passed to
 * edit()/editField()/editItem() and the list components, and checks each.
 * Ids built at runtime (placeImageSlotId(card.key)) are covered by the
 * patterns and by the registry tests instead.
 */

const ROOT = path.resolve(import.meta.dirname, "../../..");
const SCAN = ["app", "components", "modules"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "node_modules" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

const PATTERNS = [
  /\b(?:edit|editField|editItem)\(\s*"([a-zA-Z][\w.-]*)"/g,
  /\b(?:hrefSlot|pairSlot):\s*"([a-zA-Z][\w.-]*)"/g,
  /\blistId="([a-zA-Z][\w.-]*)"/g,
  /\bconst (?:TEAM|MARQUEE) = "([a-zA-Z][\w.-]*)"/g,
  // Look keys written out in full: "about.hero.image@focus".
  /"([a-z][\w.-]*@(?:focus|align|size)(?:Mobile)?)"/g,
];

describe("slot ids used in the pages", () => {
  const uses = SCAN.flatMap((dir) => sourceFiles(path.join(ROOT, dir))).flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return PATTERNS.flatMap((pattern) =>
      [...source.matchAll(pattern)].map((match) => ({ id: match[1], file: path.relative(ROOT, file) }))
    );
  });

  it("finds the ones it is meant to check", () => {
    expect(uses.length).toBeGreaterThan(40);
  });

  it("are all in the registry", () => {
    const unknown = uses.filter((use) => slotKindFor(use.id) == null);
    expect(unknown).toEqual([]);
  });

  it("give list tools only list slots", () => {
    const lists = uses.filter((use) => /listId|TEAM|MARQUEE/.test(use.file) || use.id.endsWith(".members") || use.id === "about.marquee");
    for (const use of lists) expect(slotById(use.id)?.kind, `${use.file}: ${use.id}`).toBe("list");
  });
});
