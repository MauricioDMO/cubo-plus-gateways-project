// Shared, dependency-free string helpers. Safe to import from client components
// (no server-only, no env access).

// Accents are dropped rather than becoming hyphens: "Políticas" is "politicas".
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The word the owner sees for a stored status. Only the label changes; the
 * stored values stay publish, published, draft and private.
 */
export function contentStatusLabel(status: string): string {
  if (status === "publish" || status === "published") return "Published";
  if (status === "private") return "Private (hidden)";
  return "Draft (hidden)";
}
