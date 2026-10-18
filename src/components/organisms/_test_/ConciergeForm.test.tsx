// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import ConciergeForm from "@/components/organisms/ConciergeForm";

const props = {
  fallbackEmail: "getaways@example.com",
  listingSlug: "good-waves",
  listingTitle: "Good Waves",
  initialCheckIn: "2026-09-15",
  initialCheckOut: "2026-09-20",
};

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ConciergeForm", () => {
  it("closes the picker with a next step while nothing is chosen", () => {
    render(<ConciergeForm fallbackEmail="hola@example.com" />);

    /* The fields only appear once a service is ticked, so without this the
       page ended at the last service in the last group. */
    expect(screen.getByText(/Pick anything above/)).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: /^Airport transfer/ }));
    expect(screen.queryByText(/Pick anything above/)).toBeNull();
  });

  it("reveals the short request form after a service is selected", () => {
    render(<ConciergeForm {...props} />);

    expect(screen.queryByLabelText("Name")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: /^Surf lessons/ }));

    expect(screen.getByRole("heading", { name: "Your trip details" })).toBeTruthy();
    expect(screen.getByText("A few details help us arrange the right people and timing.")).toBeTruthy();
    expect(screen.getByLabelText("Name")).toBeTruthy();
    expect(screen.getByText("Selected: Surf lessons")).toBeTruthy();
    expect(document.querySelector(".concierge-form__context")?.textContent).toContain("El Salvador");
    expect(screen.getByText("Good Waves")).toBeTruthy();
    expect(screen.getByText(/15.*20.*2026/)).toBeTruthy();
    expect(screen.getByText("No commitment. We’ll reply personally.")).toBeTruthy();
  });

  it("treats the fully customized path as one deliberate exclusive choice", () => {
    render(<ConciergeForm {...props} initialServices={["airport_transfer"]} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /^Customize a full experience/ }));

    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: /^Customize a full experience/ }).checked).toBe(true);
    expect(screen.getByText(/Selected: Customize a full experience/)).toBeTruthy();

    /* Option 2 leaves the screen entirely: every service in it would undo the
       choice just made, and with the list still there the fields below it were
       a screen and a half past the fold. */
    expect(screen.queryByRole("checkbox", { name: /^Airport transfer/ })).toBeNull();
    expect(screen.getByText(/untick the card above/)).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: /^Customize a full experience/ }));
    const transfer = screen.getByRole<HTMLInputElement>("checkbox", { name: /^Airport transfer/ });
    expect(transfer.checked).toBe(false);

    // And the exclusivity holds the other way round.
    fireEvent.click(transfer);
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: /^Customize a full experience/ }).checked).toBe(false);
  });

  it("offers notes to everyone and demands them from nobody", () => {
    /*
     * There used to be a "Something else" box that turned this field
     * compulsory. It is gone: an empty box that only works if you also write
     * a paragraph is a worse way to ask for a paragraph than the paragraph
     * field itself, which is right here and always has been.
     */
    render(<ConciergeForm {...props} />);
    expect(screen.queryByRole("checkbox", { name: /^Something else/ })).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: /^Surf lessons/ }));
    const notes = screen.getByLabelText<HTMLTextAreaElement>("Notes (optional)");
    expect(notes.required).toBe(false);
  });

  it("keeps call scheduling hidden until explicitly requested", () => {
    render(<ConciergeForm {...props} initialServices={["surf_lessons"]} />);

    expect(screen.queryByLabelText("Preferred call day")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Prefer a call?/ }));
    expect(screen.getByLabelText("Preferred call day")).toBeTruthy();
    expect(screen.getByLabelText("Preferred call time")).toBeTruthy();
  });

});
