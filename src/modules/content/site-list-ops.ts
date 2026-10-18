import type { ListItem, ListSchema } from "@/modules/content/site-content";

/*
 * The edits a list can take -- move, add, duplicate, remove, change a field.
 * Pure, so the editor applies them to its own copy immediately and sends the
 * whole list as one value; the server validates it like any other.
 */

export function newItemId(): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`;
  return random.replace(/[^a-z0-9]/gi, "").slice(0, 8);
}

/** Moves an item so it lands before the item now at `toIndex` (items.length = the end). */
export function moveItem(items: ListItem[], id: string, toIndex: number): ListItem[] {
  const from = items.findIndex((item) => item.id === id);
  if (from < 0) return items;
  let to = Math.max(0, Math.min(items.length, toIndex));
  if (from < to) to -= 1;
  if (to === from) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function moveBy(items: ListItem[], id: string, delta: number): ListItem[] {
  const from = items.findIndex((item) => item.id === id);
  if (from < 0) return items;
  const to = Math.max(0, Math.min(items.length - 1, from + delta));
  if (to === from) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** A new, empty item at the end. */
export function addItem(items: ListItem[], schema: ListSchema, id: string): ListItem[] {
  const item: ListItem = { id };
  for (const field of schema.fields) item[field.key] = "";
  return [...items, item];
}

/** A copy of an item, right after it. */
export function duplicateItem(items: ListItem[], id: string, newId: string): ListItem[] {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;
  return [...items.slice(0, index + 1), { ...items[index], id: newId }, ...items.slice(index + 1)];
}

export function removeItem(items: ListItem[], id: string): ListItem[] {
  return items.filter((item) => item.id !== id);
}

export function setField(items: ListItem[], id: string, key: string, value: string): ListItem[] {
  return items.map((item) => (item.id === id ? { ...item, [key]: value } : item));
}

/** What to call an item in a confirmation: its first filled-in text field. */
export function displayName(item: ListItem, schema: ListSchema): string {
  const field = schema.fields.find((candidate) => candidate.kind === "text" && (item[candidate.key] ?? "").trim());
  return field ? item[field.key].trim() : "";
}
