import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name.startsWith(".") || ["node_modules", "public", "data"].includes(entry.name)
        ? [] : sourceFiles(full);
    }
    return /\.[cm]?tsx?$/.test(entry.name) ? [full] : [];
  });
}

it("keeps tests in _test_ and imports on the reorganized paths", () => {
  const files = sourceFiles(root);
  const misplaced = files.filter((file) => /\.test\.tsx?$/.test(file) && !file.split(path.sep).includes("_test_"));
  const obsolete = files.filter((file) => {
    const source = readFileSync(file, "utf8");
    return /(?:from\s*|import\s*(?:\(\s*)?)["']@\/lib(?:\/|["'])/.test(source)
      || /(?:from\s*|import\s*(?:\(\s*)?)["']@\/components\/(?!atoms\/|molecules\/|organisms\/|templates\/|seo\/)/.test(source)
      || path.relative(root, file).startsWith(`lib${path.sep}`);
  });
  expect(misplaced.map((file) => path.relative(root, file))).toEqual([]);
  expect(obsolete.map((file) => path.relative(root, file))).toEqual([]);
});
