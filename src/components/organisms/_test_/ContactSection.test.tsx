// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import EditorialTemplate from "@/components/templates/EditorialTemplate";
import { BUSINESS } from "@/modules/site/business";

afterEach(cleanup);

it("restores the contact design without a form and leaves other editorial pages alone", () => {
  const data = { kind: "page" as const, title: "Contact Us", path: "/contact-us", isContact: true, html: "<p>Editorial content</p>", article: null };
  const { container, rerender } = render(<EditorialTemplate data={data} />);

  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Contact Us.");
  expect(screen.queryByText("Editorial content")).toBeNull();
  expect(screen.queryByRole("form")).toBeNull();
  expect(container.querySelector("input, textarea, button")).toBeNull();
  expect(screen.getByRole("link", { name: /Call us/ }).getAttribute("href")).toBe("tel:+50360627813");
  expect(screen.getByRole("link", { name: /Email us/ }).getAttribute("href")).toBe(`mailto:${BUSINESS.email}`);
  expect(screen.getByRole("img").getAttribute("alt")).toContain("coast of El Salvador");
  expect(container.textContent).toContain("We’ll be happy to assist you");
  expect(container.querySelector('script[type="application/ld+json"]')?.textContent).toContain("BreadcrumbList");
  expect(container.innerHTML).toContain('"@type":"ContactPage"');

  rerender(<EditorialTemplate data={{ ...data, title: "Another page", path: "/another-page", isContact: false }} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Another page");
  expect(screen.getByText("Editorial content")).toBeTruthy();
  expect(screen.queryByRole("link", { name: /Call us/ })).toBeNull();
});
