// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import BookingDatePicker from "@/components/molecules/BookingDatePicker";
import PhoneNumberField from "@/components/molecules/PhoneNumberField";

afterEach(cleanup);

it("keeps date selection, minimum dates and caller styles", () => {
  const onChange = vi.fn();
  render(
    <>
      <label htmlFor="arrival">Arrival</label>
      <BookingDatePicker id="arrival" value="2040-06-14" min="2040-06-10" onChange={onChange} className="rounded-lg" />
    </>,
  );

  const trigger = screen.getByLabelText("Arrival");
  expect(trigger.classList.contains("rounded-lg")).toBe(true);
  expect(trigger.classList.contains("rounded-[10px]")).toBe(false);
  fireEvent.click(trigger);
  expect(screen.getByRole("button", { name: /June 9th, 2040/ }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: /June 15th, 2040/ }));
  expect(onChange).toHaveBeenCalledWith("2040-06-15");
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("keeps the phone input labeled, editable and styled through library props", () => {
  const onChange = vi.fn();
  render(
    <>
      <label htmlFor="phone">Phone</label>
      <PhoneNumberField id="phone" value="+12133734253" onChange={onChange} className="min-h-13" />
    </>,
  );

  const input = screen.getByLabelText<HTMLInputElement>("Phone");
  expect(input.classList.contains("flex-1")).toBe(true);
  expect(input.closest(".PhoneInput")?.classList.contains("min-h-13")).toBe(true);
  expect(screen.getByRole("combobox", { name: "Phone number country" }).classList.contains("absolute")).toBe(true);
  fireEvent.change(input, { target: { value: "+1 213 373 4254" } });
  expect(onChange).toHaveBeenCalledWith("+12133734254");
});
