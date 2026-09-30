import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StudioForm } from "@/components/StudioForm";
import { SchoolCodeManager } from "@/components/SchoolCodeManager";
import { SectionManager } from "@/components/SectionManager";
import { PromotionManager } from "@/components/PromotionManager";
import type { ContentRecord } from "@/lib/content";

export const metadata: Metadata = { title: "Teens2Inspire Studio" };
export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="empty-library page-shell"><h1>Teens2Inspire Studio</h1><p>Connect Supabase to open the publishing studio.</p></div>;
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "administrator") redirect("/");
  const now = new Date().toISOString();
  const [{ count: published }, { count: drafts }, { count: events }, { data: recent }, { data: messages }, { count: messageCount }, { data: userCount }, { count: activeMembers }, { data: studioItems }, { data: sections }, { data: sectionLinks }, { data: audit }] = await Promise.all([
    supabase.from("content").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("content").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("content").select("id", { count: "exact", head: true }).eq("type", "event").eq("status", "published").gte("starts_at", now),
    supabase.from("content").select("id,title,type,status,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("messages").select("id,name,email,subject,message,created_at,read").order("created_at", { ascending: false }).limit(8),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase.rpc("studio_user_count"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).in("membership_tier", ["personal", "family"]).eq("membership_status", "active"),
    supabase.from("content").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("sections").select("*").order("display_order").limit(100),
    supabase.from("section_content").select("section_id,content_id,display_order").order("display_order").limit(1000),
    supabase.from("admin_audit_log").select("action,entity_type,entity_id,details,created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const assignments: Record<string, string[]> = {};
  for (const link of sectionLinks ?? []) (assignments[link.section_id] ||= []).push(link.content_id);
  const contentSections: Record<string, string[]> = {};
  for (const link of sectionLinks ?? []) (contentSections[link.content_id] ||= []).push(link.section_id);
  return <div className="studio-page page-shell">
    <div className="studio-heading"><div><span className="eyebrow eyebrow-line">Owner publishing space</span><h1>Teens2Inspire <em>Studio</em></h1><p>Manage the content and collections shared across the platform.</p></div><Link className="button button-outline" href="/">View the site <span>↗</span></Link></div>
    <nav className="studio-local-nav" aria-label="Studio sections"><a href="#overview">Overview</a><a href="#content">Content</a><a href="#sections">Sections</a><a href="#promotions">Promotions</a><a href="#activity">Activity</a><a href="#messages">Messages</a></nav>
    <section id="overview" className="studio-stats" aria-label="Studio overview"><div><span>Published content</span><b>{published ?? 0}</b></div><div><span>Drafts</span><b>{drafts ?? 0}</b></div><div><span>Upcoming events</span><b>{events ?? 0}</b></div><div><span>Active paid members</span><b>{activeMembers ?? 0}</b></div><div><span>Messages</span><b>{messageCount ?? 0}</b></div><div><span>Users</span><b>{userCount ?? 0}</b></div></section>
    <section id="content" className="studio-editor"><span className="eyebrow">Content library</span><h2>Create and edit content</h2><p>Published items appear automatically in their assigned sections and public libraries.</p><StudioForm eventManager={false} items={(studioItems ?? []) as ContentRecord[]} sections={(sections ?? []) as any[]} contentSections={contentSections} /></section>
    <section id="sections"><SectionManager initialSections={(sections ?? []) as any[]} items={(studioItems ?? []) as ContentRecord[]} initialAssignments={assignments} /></section>
    <PromotionManager />
    <SchoolCodeManager />
    <section className="studio-lower" id="activity"><div><div className="section-heading"><div><span className="eyebrow">Studio log</span><h2>Recent admin activity</h2></div></div><div className="activity-list">{audit?.length ? audit.map((entry: any, index: number) => <div className="activity-row" key={`${entry.created_at}-${index}`}><span className="status-dot status-published"/><div><b>{entry.action.replaceAll("_", " ")}</b><small>{entry.entity_type}{entry.details?.name ? ` · ${entry.details.name}` : ""} · {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></div></div>) : <p className="muted-copy">Administrative changes will appear here once the server audit key is configured.</p>}</div><div className="section-heading" style={{ marginTop: 30 }}><div><span className="eyebrow">What’s been happening</span><h2>Recent content</h2></div></div><div className="activity-list">{recent?.length ? recent.map((item: any) => <div className="activity-row" key={item.id}><span className={`status-dot status-${item.status}`}/><div><b>{item.title}</b><small>{item.type} · {item.status} · {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></div></div>) : <p className="muted-copy">Your first piece of content will show up here.</p>}</div></div>
      <div id="messages"><div className="section-heading"><div><span className="eyebrow">From the community</span><h2>Latest messages</h2></div></div><div className="activity-list">{messages?.length ? messages.map((message: any) => <details className="message-row" key={message.id}><summary><span>{message.name}</span><b>{message.subject}</b><small>{new Date(message.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></summary><p>{message.message}</p><a href={`mailto:${message.email}`}>{message.email}</a></details>) : <p className="muted-copy">No new notes yet.</p>}</div></div>
    </section>
  </div>;
}
