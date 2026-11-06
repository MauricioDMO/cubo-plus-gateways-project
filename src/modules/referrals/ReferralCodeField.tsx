"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";
import { normalizeReferralCode } from "./referral-rules";
import { readReferral, rememberReferral, setReferralParam } from "./referral-session";

function subscribe(notify: () => void) {
  window.addEventListener("popstate", notify);
  return () => window.removeEventListener("popstate", notify);
}

export default function ReferralCodeField({ id }: { id: string }) {
  const inherited = useSyncExternalStore(subscribe, readReferral, () => "");
  const [draft, setDraft] = useState<string>();
  const [feedback, setFeedback] = useState("");
  const [checking, setChecking] = useState(false);
  const revision = useRef(0);
  const value = draft ?? inherited;

  function edit(next: string) {
    revision.current++;
    setDraft(next);
    setFeedback("");
    setChecking(false);
    rememberReferral(next);
    const url = new URL(window.location.href);
    if (url.searchParams.has("ref")) {
      setReferralParam(url.searchParams, next);
      window.history.replaceState(window.history.state, "", url);
    }
  }

  async function check() {
    const code = normalizeReferralCode(value);
    if (!code) {
      setFeedback("Use 4–24 letters, numbers or hyphens.");
      return;
    }
    const current = ++revision.current;
    setChecking(true);
    try {
      const response = await fetch("/api/referrals/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error("check failed");
      const result = await response.json();
      if (current === revision.current) setFeedback(result.valid
        ? "Active code. We’ll check it again when you book."
        : "This code is inactive or unknown. You can still book.");
    } catch {
      if (current === revision.current) setFeedback("Couldn’t check the code. You can retry or continue booking.");
    } finally {
      if (current === revision.current) setChecking(false);
    }
  }

  return <div className="grid gap-1.5 text-[13px]">
    <Label htmlFor={id}>Referral code (optional)</Label>
    <Input id={id} name="referral_code" maxLength={24} value={value} autoComplete="off"
      spellCheck={false} onChange={event => edit(event.target.value)} aria-describedby={id + "-hint"} />
    <span id={id + "-hint"}>This tells us who referred you. Your price stays the same.</span>
    {value && <div className="flex gap-4">
      <button type="button" className="min-h-11 underline" disabled={checking} onClick={() => void check()}>
        {checking ? "Checking…" : "Check code"}
      </button>
      <button type="button" className="min-h-11 underline" onClick={() => edit("")}>Remove code</button>
    </div>}
    <span role="status">{feedback}</span>
  </div>;
}
