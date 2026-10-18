export function blogPostPath(publishedAt: string, slug: string): string {
  const d = new Date(publishedAt);
  const year = d.getUTCFullYear().toString();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `/${year}/${month}/${day}/${slug}`;
}
