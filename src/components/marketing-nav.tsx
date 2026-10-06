"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";

const links = [
  ["Events", "/events"],
  ["School", "/school"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export function MarketingNav({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const destination = signedIn ? "/download" : "/login";
  return (
    <header className="marketing-header">
      <div className="marketing-nav-wrap">
        <Brand />
        <nav className={`marketing-links${open ? " is-open" : ""}`} aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <span className="marketing-mobile-actions">
            <Link href={destination} onClick={() => setOpen(false)}>{signedIn ? "Download the app" : "Log in"}</Link>
            {!signedIn && <Link className="button button-small button-primary" href="/signup" onClick={() => setOpen(false)}>Join Teens2Inspire</Link>}
          </span>
        </nav>
        <div className="marketing-actions">
          <Link href={destination}>{signedIn ? "Download the app" : "Log in"}</Link>
          {!signedIn && <Link className="button button-small button-primary" href="/signup">Join Teens2Inspire</Link>}
        </div>
        <button className="menu-toggle" type="button" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
