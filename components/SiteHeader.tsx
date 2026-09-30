"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const links = [
  ["Home", "/"], ["Listen", "/listen"], ["Watch", "/watch"],
  ["Resources", "/resources"], ["Events", "/events"], ["Search", "/search"],
];

export function SiteHeader({ initialSignedIn = false, sections = [] }: { initialSignedIn?: boolean; sections?: { name: string; slug: string }[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [authError, setAuthError] = useState("");
  useEffect(() => setSignedIn(initialSignedIn), [initialSignedIn]);
  useEffect(() => {
    let client: ReturnType<typeof createClient>;
    try { client = createClient(); } catch { return; }
    client.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));
    return () => subscription.unsubscribe();
  }, []);
  async function signOut() {
    setAuthError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      setSignedIn(false); setOpen(false); router.replace("/"); router.refresh();
    } catch { setAuthError("We couldn’t sign you out. Please try again."); }
  }
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return <header className="site-header">
    <div className="header-inner">
      <Link className="brand" href="/" aria-label="Teens2Inspire home" onClick={() => setOpen(false)}>
        <Image src="/teens2inspire-logo.webp" alt="" className="brand-logo" width={384} height={128} priority />
      </Link>
      <button className="menu-toggle" aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
        <span className="sr-only">{open ? "Close" : "Open"} navigation menu</span><span /><span />
      </button>
      <nav id="primary-navigation" className={`primary-nav${open ? " is-open" : ""}`} aria-label="Main navigation">
        {links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
        {sections.length > 0 && <details className="header-collections"><summary>Collections</summary><div>{sections.map((section) => <Link key={section.slug} href={`/sections/${section.slug}`} onClick={() => setOpen(false)}>{section.name}</Link>)}</div></details>}
        <div className="mobile-account">{signedIn ? <><Link href="/saved" onClick={() => setOpen(false)}>Library</Link><Link href="/profile" onClick={() => setOpen(false)}>Profile</Link><button type="button" onClick={() => void signOut()}>Log out</button></> : <><Link href="/signup" onClick={() => setOpen(false)}>Join / Sign up</Link><Link href="/login" onClick={() => setOpen(false)}>Sign in</Link></>}{authError && <span className="header-auth-error" role="alert">{authError}</span>}</div>
      </nav>
      <div className="header-actions">{signedIn ? <><Link className="header-login" href="/saved">Library</Link><Link className="header-login" href="/profile">Profile</Link><button className="header-logout" type="button" onClick={() => void signOut()}>Log out</button></> : <><Link className="header-join" href="/signup">Join / Sign up <span aria-hidden="true">↗</span></Link><Link className="header-login" href="/login">Sign in</Link></>}{authError && <span className="header-auth-error" role="alert">{authError}</span>}</div>
    </div>
  </header>;
}
