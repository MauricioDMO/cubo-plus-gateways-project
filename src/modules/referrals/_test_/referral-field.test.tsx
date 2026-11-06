// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import ReferralCodeField from "../ReferralCodeField";
import { setReferralParam } from "../referral-session";
afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); });
it("preserves an edited code across guest login and removes an inherited link", () => {
  history.replaceState({}, "", "/listing/demo?ref=SHARED&check_in=2099-01-01");
  render(<form><ReferralCodeField id="ref" /></form>);
  const field = screen.getByLabelText<HTMLInputElement>("Referral code (optional)");
  expect(field.value).toBe("SHARED");
  fireEvent.change(field, { target: { value: "my-code" } });
  const next = new URLSearchParams(location.search);
  setReferralParam(next, field.value);
  expect(next.get("ref")).toBe("MY-CODE");
  fireEvent.click(screen.getByText("Remove code"));
  expect(new FormData(field.form!).get("referral_code")).toBe("");
  expect(new URLSearchParams(location.search).has("ref")).toBe(false);
  expect(new URLSearchParams(location.search).get("check_in")).toBe("2099-01-01");
  expect(sessionStorage.getItem("gateways_referral_code")).toBeNull();
});
it("ignores late validation of a code the guest removed", async () => {
  let finish!: (r: Response) => void;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
  render(<ReferralCodeField id="ref" />);
  fireEvent.change(screen.getByLabelText("Referral code (optional)"), { target: { value: "SURF2026" } });
  fireEvent.click(screen.getByText("Check code"));
  fireEvent.click(screen.getByText("Remove code"));
  await act(async () => finish(Response.json({ valid: true })));
  expect(screen.getByRole("status").textContent).toBe("");
});
