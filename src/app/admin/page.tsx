import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Plus, LibraryBig, Users, CalendarDays, PanelsTopLeft, TicketPercent, School, Mail, ArrowUpRight, Sparkles, Handshake, SlidersHorizontal, Radio, Megaphone } from "lucide-react";

const actions = [
  { title: "Add content", description: "Publish a podcast, video, article, printable, or resource.", href: "/admin/add", icon: Plus, accent: "rose", label: "Create something" },
  { title: "Manage content", description: "Edit, publish, unpublish, and organize your library.", href: "/admin/content", icon: LibraryBig, accent: "plum", label: "Content library" },
  { title: "Manage members", description: "Review member accounts and membership status.", href: "/admin/members", icon: Users, accent: "gold", label: "Member directory" },
  { title: "Codes & gifts", description: "Manage school access, discounts, and gift-code setup.", href: "/admin/codes", icon: TicketPercent, accent: "blue", label: "Access & offers" },
  { title: "Events", description: "Create events with flyers, details, and registration links.", href: "/admin/events", icon: CalendarDays, accent: "rose", label: "Event calendar" },
  { title: "Sections", description: "Create homepage shelves and choose where content appears.", href: "/admin/sections", icon: PanelsTopLeft, accent: "plum", label: "Homepage layout" },
  { title: "Partnerships", description: "Control the looping partner carousel on the public homepage.", href: "/admin/partnerships", icon: Handshake, accent: "rose", label: "Public website" },
  { title: "Site & About copy", description: "Edit the homepage mission, founder bio, and podcast description.", href: "/admin/site-settings", icon: SlidersHorizontal, accent: "plum", label: "Marketing CMS" },
  { title: "Website pop-up", description: "Upload a promotional image or video and publish a homepage announcement on Teens2Inspire.org.", href: "https://teens2inspire.org/admin/popup", icon: Megaphone, accent: "rose", label: "Marketing control" },
  { title: "Podcast platforms", description: "Manage all click-through listening services shown on the podcast page.", href: "/admin/podcast-platforms", icon: Radio, accent: "gold", label: "Podcast distribution" },
];
export default async function Admin() {
  const { supabase, user } = await requireAdmin();
  const [content, members, events, sections, inquiries, partnerships, platforms] = await Promise.all([
    supabase.from("content").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("sections").select("id", { count: "exact", head: true }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
    supabase.from("partnerships").select("id", { count: "exact", head: true }),
    supabase.from("podcast_platforms").select("id", { count: "exact", head: true }),
  ]);
  return <div className="studio-dashboard">
    <div className="studio-welcome"><div><span className="studio-eyebrow"><Sparkles size={14}/> YOUR CREATIVE WORKSPACE</span><h1>Your dashboard</h1><p>Welcome back{user.email ? `, ${user.email}` : ""}. What would you like to work on today?</p></div><Link href="/admin/add" className="studio-primary-button"><Plus size={18}/> Add content</Link></div>
    <Link href="https://teens2inspire.org/admin/popup" className="studio-promo-spotlight"><span className="studio-promo-sigil"><Megaphone size={26}/></span><span className="studio-promo-text"><small>YOUR NEXT ANNOUNCEMENT</small><strong>Take over the homepage.</strong><span>Control a launch trailer, photo announcement, or special promotion—complete with an editable message and publishing switch.</span></span><span className="studio-promo-action">Open pop-up studio <ArrowUpRight size={17}/></span></Link>
    <div className="studio-stats">
      {[["Content items", content.count, LibraryBig], ["Members", members.count, Users], ["Events", events.count, CalendarDays], ["Sections", sections.count, PanelsTopLeft]].map(([label, value, Icon]: any) => <div className="studio-stat" key={label}><span className="studio-stat-icon"><Icon size={18}/></span><span className="studio-stat-label">{label}</span><strong>{value ?? "—"}</strong></div>)}
    </div>
    <div className="studio-section-heading"><div><h2>Quick actions</h2><p>Everything you manage, organized in one place.</p></div></div>
    <div className="studio-action-grid">{actions.map(({title,description,href,icon:Icon,accent,label})=><Link className={`studio-action-card ${accent}`} href={href} key={href}><span className="studio-action-icon"><Icon size={21}/></span><span className="studio-action-kicker">{label}</span><strong>{title}</strong><p>{description}</p><span className="studio-action-arrow"><ArrowUpRight size={17}/></span></Link>)}</div>
    <div className="studio-bottom-grid"><Link href="/admin/partnerships" className="studio-shortcut"><span className="studio-shortcut-icon"><Handshake size={18}/></span><span><strong>Homepage partners</strong><small>{partnerships.count ?? 0} partner logos and links</small></span><ArrowUpRight size={16}/></Link><Link href="/admin/podcast-platforms" className="studio-shortcut"><span className="studio-shortcut-icon"><Radio size={18}/></span><span><strong>Podcast listening links</strong><small>{platforms.count ?? 0} directory links</small></span><ArrowUpRight size={16}/></Link><Link href="/admin/schools" className="studio-shortcut"><span className="studio-shortcut-icon"><School size={18}/></span><span><strong>School access</strong><small>School accounts and codes</small></span><ArrowUpRight size={16}/></Link><Link href="/admin/inquiries" className="studio-shortcut"><span className="studio-shortcut-icon"><Mail size={18}/></span><span><strong>Inbox</strong><small>{inquiries.count ?? 0} contact and school inquiries</small></span><ArrowUpRight size={16}/></Link></div>
  </div>;
}
