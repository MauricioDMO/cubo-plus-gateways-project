"use client";

import { useRef, useState } from "react";
import { SITE_URL } from "@/content/landing";
import Logo from "../getaways/logo";
import { Icon } from "../atoms/icon";
import { ButtonLink } from "../atoms/button-link";

const navigation = [
  { label: "Home", href: "#home" },
  { label: "About us", href: `${SITE_URL}/about/` },
  { label: "Our stays", href: "#properties" },
  { label: "The journal", href: "#journal" },
  { label: "Contact", href: `${SITE_URL}/contact-us/` },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="relative z-10" id="home">
      <div className="mx-auto flex min-h-[104px] w-[calc(100%-96px)] max-w-[1440px] items-center justify-between gap-[30px] max-[1150px]:w-[calc(100%-56px)] max-[1150px]:gap-6 max-[850px]:min-h-[88px] max-[600px]:min-h-[82px] max-[600px]:w-[calc(100%-36px)] max-[600px]:gap-3">
        <a className="flex w-[215px] shrink-0 flex-col items-center max-[1150px]:w-[175px] max-[600px]:w-[155px]" href="#home" aria-label="Getaways El Salvador home">
          <Logo className="block h-auto w-full text-coastal" aria-hidden="true" />
          <span className="mt-[3px] ml-[38px] text-[7px] leading-none tracking-[4.5px] max-[600px]:ml-[27px] max-[600px]:text-[6px] max-[600px]:tracking-[3px]">EL SALVADOR</span>
        </a>
        <nav className={`flex items-center gap-[29px] max-[1150px]:gap-5 max-[850px]:absolute max-[850px]:inset-x-5 max-[850px]:top-[78px] max-[850px]:flex-col max-[850px]:items-stretch max-[850px]:gap-0 max-[850px]:rounded-[14px] max-[850px]:border max-[850px]:border-divider max-[850px]:bg-surface-white max-[850px]:px-6 max-[850px]:pt-[15px] max-[850px]:pb-[22px] max-[850px]:shadow-card ${open ? "" : "max-[850px]:hidden"}`} id="main-navigation" aria-label="Main navigation" onKeyDown={(event) => {
          if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); }
        }}>
          {navigation.map((item, index) => <a className="relative py-3.5 text-[12px] text-ink-body hover:text-coastal aria-[current=page]:text-coastal aria-[current=page]:after:absolute aria-[current=page]:after:bottom-[5px] aria-[current=page]:after:left-1/2 aria-[current=page]:after:size-1 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-coastal aria-[current=page]:after:content-[''] max-[850px]:py-3 max-[850px]:text-[14px] max-[850px]:after:hidden" key={item.label} href={item.href} aria-current={index === 0 ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}</a>)}
          <a className="mt-[7px] hidden border-t border-divider py-3 text-[14px] text-ink-body hover:text-coastal max-[850px]:block" href={`${SITE_URL}/account/login/`}>Sign in</a>
        </nav>
        <div className="flex items-center gap-[25px] max-[1150px]:gap-4 max-[600px]:gap-2.5">
          <a className="flex items-center gap-[7px] text-[12px] max-[1150px]:hidden" href={`${SITE_URL}/account/login/`}><Icon name="user" className="size-[15px]" />Sign in</a>
          <ButtonLink className="min-h-[43px]! gap-[19px]! px-[19px]! py-[11px]! text-[11px]! max-[600px]:min-h-11! max-[600px]:gap-2.5! max-[600px]:px-[13px]! max-[600px]:py-[9px]! max-[600px]:text-[10px]! max-[600px]:[&_svg]:hidden max-[360px]:hidden" href={`${SITE_URL}/submit-listing/`}>List a property</ButtonLink>
          <button ref={toggleRef} className="cursor-pointer hidden size-11 items-center justify-center rounded-full border border-divider bg-transparent text-ink-strong transition-colors motion-reduce:transition-none duration-200 hover:bg-coastal/10 max-[850px]:inline-flex" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /></button>
        </div>
      </div>
    </header>
  );
}
