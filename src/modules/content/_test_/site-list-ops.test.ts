import { describe, expect, it } from "vitest";

import { addItem, displayName, duplicateItem, moveBy, moveItem, newItemId, removeItem, setField } from "@/modules/content/site-list-ops";

const list = [
  { id: "a", name: "Ana" },
  { id: "b", name: "Bea" },
  { id: "c", name: "Cris" },
];
const ids = (items: Array<{ id: string }>) => items.map((item) => item.id).join("");
const schema = { noun: "person", fields: [{ key: "photo", kind: "image" as const, label: "Photo" }, { key: "name", kind: "text" as const, label: "Name" }] };

describe("list edits", () => {
  it("moves an item to a drop position", () => {
    expect(ids(moveItem(list, "a", 3))).toBe("bca"); // to the end
    expect(ids(moveItem(list, "c", 0))).toBe("cab"); // to the front
    expect(ids(moveItem(list, "a", 2))).toBe("bac"); // before c
    expect(moveItem(list, "a", 1)).toBe(list); // where it already is
  });

  it("moves one step, stopping at the ends", () => {
    expect(ids(moveBy(list, "b", -1))).toBe("bac");
    expect(ids(moveBy(list, "b", 1))).toBe("acb");
    expect(moveBy(list, "a", -1)).toBe(list);
  });

  it("adds an empty item with every field", () => {
    expect(addItem(list, schema, "d").at(-1)).toEqual({ id: "d", photo: "", name: "" });
  });

  it("duplicates right after the original, and removes", () => {
    expect(ids(duplicateItem(list, "a", "z"))).toBe("azbc");
    expect(duplicateItem(list, "a", "z")[1].name).toBe("Ana");
    expect(ids(removeItem(list, "b"))).toBe("ac");
  });

  it("changes one field of one item", () => {
    expect(setField(list, "b", "name", "Beatriz")[1]).toEqual({ id: "b", name: "Beatriz" });
    expect(list[1].name).toBe("Bea");
  });

  it("names an item by its first filled-in text", () => {
    expect(displayName({ id: "a", photo: "1", name: "Ana" }, schema)).toBe("Ana");
    expect(displayName({ id: "a", photo: "1", name: "" }, schema)).toBe("");
  });

  it("makes short ids the list accepts", () => {
    expect(newItemId()).toMatch(/^[A-Za-z0-9]{1,8}$/);
  });
});
