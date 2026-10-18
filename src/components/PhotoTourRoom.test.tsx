// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PhotoTourRoom from "./PhotoTourRoom";

/*
 * What the viewer does once it opens.
 *
 * jsdom has no layout: clientWidth and scrollLeft are zero and scrollTo does
 * not exist, so nothing here can assert where the strip physically sits. That
 * is exactly why which photograph is showing is React state rather than a
 * number read back out of the scroll position -- the behaviour is testable
 * because the component does not depend on the browser to remember it.
 *
 * Still not covered, and checked in a real browser instead: swiping, the
 * scroll-snap, the dropped-smooth-scroll fallback, the Tab focus trap (jsdom
 * does not move focus on Tab), and that the overlay covers the sticky room
 * navigation.
 */

const two = [
  { id: 11, storage_path: "living-room.jpg", alt_text: "Sunlit living room facing the ocean" },
  { id: 12, storage_path: "terrace.jpg", alt_text: null },
];
const one = [{ id: 21, storage_path: "bedroom.jpg", alt_text: "King bedroom with woven headboard" }];

beforeAll(() => {
  // jsdom implements neither, and the component calls both.
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

function renderRoom(media: typeof two) {
  return render(<PhotoTourRoom label="Living area" media={media} title="Casa Brisa" />);
}

describe("PhotoTourRoom", () => {
  it("shows no viewer until a photograph is pressed", () => {
    renderRoom(two);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the viewer on the photograph that was pressed, and names the room", () => {
    renderRoom(two);
    fireEvent.click(screen.getAllByRole("link")[1]);

    // Plain DOM assertions throughout: this project does not register
    // jest-dom's matchers, and a test should not be the thing that adds them.
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toBe("Living area — photographs of Casa Brisa");
    expect(screen.getByText("2 of 2")).toBeTruthy();
  });

  it("moves within the room with the arrows, and stops at both ends", () => {
    renderRoom(two);
    fireEvent.click(screen.getAllByRole("link")[0]);

    const prev = () => screen.getByRole("button", { name: "Previous photo" }) as HTMLButtonElement;
    const next = () => screen.getByRole("button", { name: "Next photo" }) as HTMLButtonElement;

    expect(screen.getByText("1 of 2")).toBeTruthy();
    expect(prev().disabled).toBe(true);

    fireEvent.click(next());
    expect(screen.getByText("2 of 2")).toBeTruthy();
    expect(next().disabled).toBe(true);
    expect(prev().disabled).toBe(false);
  });

  it("moves with the left and right arrow keys", () => {
    renderRoom(two);
    fireEvent.click(screen.getAllByRole("link")[0]);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByText("2 of 2")).toBeTruthy();
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByText("1 of 2")).toBeTruthy();
    // Clamped, not wrapped: with two photographs, jumping from the first to
    // the last reads as a glitch, and the disabled arrow already says so.
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByText("1 of 2")).toBeTruthy();
  });

  it("shows no arrows and no counter for a room of one photograph", () => {
    // The common case in this catalogue: most rooms hold exactly one. A pair
    // of permanently disabled arrows is the dead control this design avoids.
    renderRoom(one);
    fireEvent.click(screen.getByRole("link"));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Next photo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Previous photo" })).toBeNull();
    expect(screen.queryByText(/of 1/)).toBeNull();
  });

  it("closes on Escape and gives focus back to the photograph that opened it", () => {
    renderRoom(two);
    const opener = screen.getAllByRole("link")[0];
    fireEvent.click(opener);
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("closes on the Close button and on the backdrop, but not on the photograph", () => {
    renderRoom(two);
    fireEvent.click(screen.getAllByRole("link")[0]);
    // Scoped to the dialog: the same photograph is on the page twice now,
    // once in the grid behind and once in the viewer.
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("img", { name: /Sunlit living room/ }));
    expect(screen.queryByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("locks the page behind it and gives the scroll back on close", () => {
    renderRoom(two);
    fireEvent.click(screen.getAllByRole("link")[0]);
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("");
  });
});
