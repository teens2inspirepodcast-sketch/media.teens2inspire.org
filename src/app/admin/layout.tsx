import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { ArrowLeft, LayoutDashboard, LibraryBig, PanelsTopLeft, CalendarDays, Users, TicketPercent, School, Mail, Handshake, SlidersHorizontal, Radio, Megaphone } from "lucide-react";

const nav = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["Content", "/admin/content", LibraryBig],
  ["Sections", "/admin/sections", PanelsTopLeft],
  ["Events", "/admin/events", CalendarDays],
  ["Members", "/admin/members", Users],
  ["Codes & gifts", "/admin/codes", TicketPercent],
  ["School access", "/admin/schools", School],
  ["Inquiries", "/admin/inquiries", Mail],
  ["Partnerships", "/admin/partnerships", Handshake],
  ["Website pop-up", "https://teens2inspire.org/admin/popup", Megaphone],
  ["Site settings", "/admin/site-settings", SlidersHorizontal],
  ["Podcast platforms", "/admin/podcast-platforms", Radio],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="admin-studio">
    <header className="studio-topbar">
      <Link href="/admin" className="studio-brand"><Image src="/teens2inspire-logo.png" alt="Teens2Inspire" width={175} height={55}/><span><small>CONTENT STUDIO</small></span></Link>
      <div className="studio-topbar-right"><span className="studio-live-dot"/> Admin workspace <Link href="/app" className="studio-view-site"><ArrowLeft size={15}/> View app</Link></div>
    </header>
    <main className="studio-main">{children}</main>
    <nav className="studio-mobile-nav" aria-label="Admin navigation">{nav.map(([label, href, Icon]) => <Link href={href} key={href}><Icon size={17}/><span>{label}</span></Link>)}</nav>
  </div>;
}
