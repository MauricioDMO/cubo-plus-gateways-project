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

it("styles day states without depending on marker classes", () => {
  render(
    <Calendar
      mode="single"
      defaultMonth={new Date(2026, 9, 1)}
      selected={new Date(2026, 9, 15)}
      today={new Date(2026, 9, 20)}
      disabled={{ before: new Date(2026, 9, 12) }}
    />,
  );

  const selected = screen.getByRole("button", { name: /October 15th, 2026/ });
  const today = screen.getByRole("button", { name: /October 20th, 2026/ });
  const disabled = screen.getByRole("button", { name: /October 5th, 2026/ });

  expect(selected.closest("td")?.classList.contains("[&>button]:bg-button-bg")).toBe(true);
  expect(selected.closest("td")?.classList.contains("[&>button:hover]:bg-button-bg")).toBe(true);
  expect(today.closest("td")?.classList.contains("[&>button]:border-link/40")).toBe(true);
  expect(disabled.closest("td")?.classList.contains("[&>button]:line-through")).toBe(true);
  expect(disabled.hasAttribute("disabled")).toBe(true);
});
