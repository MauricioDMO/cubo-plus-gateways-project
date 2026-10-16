"use client";

import { useState } from "react";
import { contact } from "@/content/contact";
import { ButtonLink } from "../atoms/button-link";
import { Icon } from "../atoms/icon";

const fieldClassName = "mt-2 block min-h-12 w-full rounded-card border border-divider bg-surface-white px-4 py-3 text-sm text-ink-strong placeholder:text-ink-muted focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#648d79] max-[600px]:text-base";

export function ContactForm() {
  const [draft, setDraft] = useState("");

  return (
    <form className="rounded-feature border border-divider bg-coastal/5 p-10 max-[600px]:p-6" action={`mailto:${contact.email}`} method="post" encType="text/plain" aria-labelledby="contact-form-title" aria-describedby="contact-form-help" onChange={() => setDraft("")} onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const name = String(data.get("name")).trim();
      const email = String(data.get("email")).trim();
      const message = String(data.get("message")).trim();
      // ponytail: mailto draft only; add a mail service when server-side delivery is needed.
      setDraft(`mailto:${contact.email}?subject=${encodeURIComponent(`Getaways inquiry from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\r\nEmail: ${email}\r\n\r\n${message}`)}`);
    }}>
      <p className="text-[10px] font-semibold tracking-[2px] text-ink-muted">LET’S START A CONVERSATION</p>
      <h2 className="mt-3 font-display text-[29px] leading-[1.3] font-medium tracking-[-1px] text-ink-strong" id="contact-form-title">Tell us about your getaway.</h2>
      <p className="mt-3 text-xs leading-[1.8]" id="contact-form-help">Prepare a draft below, then open your email app to send it. Nothing is sent from this website.</p>
      <div className="mt-7 space-y-5">
        <label className="block text-xs font-medium text-ink-strong" htmlFor="contact-name">Name (required)<input className={fieldClassName} id="contact-name" name="name" autoComplete="name" required pattern=".*\S.*" maxLength={120} title="Enter your name, not just spaces." /></label>
        <label className="block text-xs font-medium text-ink-strong" htmlFor="contact-email">Email (required)<input className={fieldClassName} id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label className="block text-xs font-medium text-ink-strong" htmlFor="contact-message">Message<textarea className={`${fieldClassName} min-h-36 resize-y`} id="contact-message" name="message" rows={5} maxLength={3000} placeholder="Your travel plans, a property inquiry, or anything you’d like to ask." /></label>
      </div>
      <button className="mt-6 inline-flex min-h-[49px] cursor-pointer items-center justify-center gap-5 rounded-full bg-coastal px-6 py-3 text-xs font-medium text-inverse shadow-action transition-colors duration-200 hover:bg-coastal/90 motion-reduce:transition-none" type="submit">Prepare email<Icon name="arrow" className="size-4" /></button>
      <div role="status" className="mt-4">
        {draft && <div className="space-y-3 border-t border-divider pt-4"><p className="text-xs">Your draft is ready. Open your email app to review and send it.</p><ButtonLink href={draft}>Open email app</ButtonLink></div>}
      </div>
    </form>
  );
}
