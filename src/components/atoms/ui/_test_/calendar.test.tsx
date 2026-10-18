// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { Calendar } from "@/components/atoms/ui/calendar";

afterEach(cleanup);

it("keeps the calendar styling hook, month navigation and date selection", () => {
  const onSelect = vi.fn();
  const { container } = render(
    <Calendar mode="single" defaultMonth={new Date(2026, 9, 1)} onSelect={onSelect} />,
  );

  expect(container.querySelector('[data-slot="calendar"]')?.classList.contains("ui-calendar")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Go to the Next Month" }));
  fireEvent.click(screen.getByRole("button", { name: "Sunday, November 15th, 2026" }));

  expect(onSelect.mock.calls[0][0]).toEqual(new Date(2026, 10, 15));
});
