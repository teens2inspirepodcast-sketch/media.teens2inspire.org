"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, CalendarDays, ChevronLeft, ChevronRight, CircleHelp, Clapperboard, Compass, FileText, Headphones, House, LogOut, Menu, MessageSquareText, Search, Settings, Shield, X } from "lucide-react";
import { Brand } from "@/components/brand";
import type { Profile } from "@/lib/auth";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const primary = [
  { label: "Home", href: "/v2/dashboard", icon: House },
  { label: "Discover", href: "/v2/discover", icon: Compass },
  { label: "Podcasts", href: "/v2/podcasts", icon: Headphones },
  { label: "Videos", href: "/v2/videos", icon: Clapperboard },
  { label: "Articles", href: "/v2/articles", icon: FileText },
  { label: "Resources", href: "/v2/resources", icon: Search },
  { label: "Events", href: "/v2/events", icon: CalendarDays },
];

function Item({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof House; active: boolean }) {
  return <Link href={href} className={`nav-item${active ? " nav-active" : ""}`} aria-current={active ? "page" : undefined}><Icon size={17} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></Link>;
}

export function V2Navigation({ profile }: { profile: Profile | null }) {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isActive = (href: string) => path === href || (href !== "/v2/dashboard" && path.startsWith(`${href}/`));
  const closeMenu = () => setMenuOpen(false);
  async function signOut() { await createBrowserSupabase().auth.signOut(); router.replace("/"); router.refresh(); }
  return (
    <>
      <aside className={`app-sidebar${collapsed ? " sidebar-collapsed" : ""}`}>
        <div className="sidebar-brand"><Brand compact={collapsed} /><button type="button" className="collapse-button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}</button></div>
        {!collapsed && <p className="sidebar-label">YOUR SPACE</p>}
        <nav className="sidebar-nav" aria-label="Member navigation">
          {primary.map((item) => <Item key={item.href} {...item} active={isActive(item.href)} />)}
          <div className="nav-divider" />
          <Item href="/v2/saved" label="Saved" icon={Bookmark} active={isActive("/v2/saved")} />
          <Item href="/v2/community" label="Community" icon={MessageSquareText} active={isActive("/v2/community")} />
          <Item href="/v2/messages" label="Messages" icon={MessageSquareText} active={isActive("/v2/messages")} />
          <Item href="/v2/membership" label="Membership" icon={Shield} active={isActive("/v2/membership")} />
        </nav>
        {!collapsed && <div className="sidebar-bottom"><Link href="/v2/profile"><Settings size={16} aria-hidden="true" />Profile and settings</Link><Link href="/contact"><CircleHelp size={16} aria-hidden="true" />Support</Link><div className="sidebar-profile"><span className="avatar-initial">{(profile?.display_name || profile?.first_name || "T").slice(0, 1).toUpperCase()}</span><span className="sidebar-profile-name">{profile?.display_name || profile?.first_name || "Your account"}<small>{profile?.membership_status === "active" ? "Member" : "Free account"}</small></span><button type="button" onClick={signOut} className="signout-button" aria-label="Sign out"><LogOut size={15} aria-hidden="true" /></button></div></div>}
      </aside>
      <header className="mobile-app-header"><Brand /><button className="menu-toggle" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></header>
      {menuOpen && <div className="mobile-menu-scrim" onClick={closeMenu}><nav className="mobile-menu" aria-label="Member navigation" onClick={(event) => event.stopPropagation()}><div className="mobile-menu-heading"><Brand /><button className="icon-button" type="button" onClick={closeMenu} aria-label="Close navigation menu"><X size={20} /></button></div>{[...primary, { label: "Saved", href: "/v2/saved", icon: Bookmark }, { label: "Community", href: "/v2/community", icon: MessageSquareText }, { label: "Messages", href: "/v2/messages", icon: MessageSquareText }, { label: "Membership", href: "/v2/membership", icon: Shield }, { label: "Settings", href: "/v2/settings", icon: Settings }].map((item) => <Link onClick={closeMenu} key={item.href} href={item.href} className={`nav-item${isActive(item.href) ? " nav-active" : ""}`}><item.icon size={17} aria-hidden="true" />{item.label}</Link>)}</nav></div>}
      <nav className="mobile-tab-bar" aria-label="Quick navigation">{[{ label: "Home", href: "/v2/dashboard", icon: House }, { label: "Discover", href: "/v2/discover", icon: Compass }, { label: "Saved", href: "/v2/saved", icon: Bookmark }, { label: "Events", href: "/v2/events", icon: CalendarDays }].map((item) => <Link key={item.href} href={item.href} className={isActive(item.href) ? "mobile-tab-active" : ""} aria-label={item.label} aria-current={isActive(item.href) ? "page" : undefined}><item.icon size={19} aria-hidden="true" /><span>{item.label}</span></Link>)}</nav>
      {profile?.role === "administrator" && <Link className="admin-shortcut" href={path.startsWith("/v2/admin") ? "/v2/admin/community" : "/v2/admin"}><Shield size={15} aria-hidden="true" /><span>{path.startsWith("/v2/admin") ? "Moderation" : "Content studio"}</span></Link>}
    </>
  );
}
