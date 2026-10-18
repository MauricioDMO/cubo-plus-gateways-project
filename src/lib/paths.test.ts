import { describe, it, expect } from "vitest";
import { blogPostPath } from "./paths";

describe("blogPostPath", () => {
  it("formats year/month/day/slug from an ISO published_at, matching WP's date-based permalinks", () => {
    expect(blogPostPath("2026-03-06T15:22:11Z", "el-zonte-guide")).toBe(
      "/2026/03/06/el-zonte-guide"
    );
  });

  it("zero-pads single-digit months and days", () => {
    expect(blogPostPath("2025-09-05T00:00:00Z", "hello-world")).toBe(
      "/2025/09/05/hello-world"
    );
  });
});
