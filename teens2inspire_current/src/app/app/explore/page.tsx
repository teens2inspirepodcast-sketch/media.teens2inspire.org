import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { MediaCard } from "@/components/media-card";
const types = [{ label: "Everything", value: "all" }, { label: "Watch", value: "video" }, { label: "Listen", value: "podcast" }, { label: "Read", value: "article" }, { label: "Resources", value: "resource" }, { label: "Printables", value: "printable" }, { label: "Originals", value: "original" }, { label: "Recipes", value: "recipe" }, { label: "Picks", value: "pick" }, { label: "Events", value: "event" }];
export default async function Explore({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { supabase } = await requireUser("/app/explore"); const params = await searchParams;
  const type = types.some(item => item.value === params.type) ? params.type! : "all";
  let query = supabase.from("content").select("id,title,description,type,cover_url").eq("status", "published").order("published_at", { ascending: false });
  if (type !== "all" && type !== "event") query = query.eq("type", type);
  const { data } = await query;
  const items = data || [];
  return <main className="app-content app-page-content"><div className="page-intro"><span className="app-overline">A WORLD OF GOOD THINGS</span><h1>Explore</h1><p>Find the conversation, story, or resource that meets you where you are.</p></div><div className="filter-pills" aria-label="Filter by format">{types.map(item => <Link href={item.value === "all" ? "/app/explore" : item.value === "event" ? "/app/events" : `/app/explore?type=${item.value}`} key={item.value} className={(type === item.value && item.value !== "event") ? "is-selected" : ""} aria-current={(type === item.value && item.value !== "event") ? "page" : undefined}>{item.label}</Link>)}</div>{items.length ? <div className="media-library-grid">{items.map(item => <MediaCard key={item.id} {...item} variant="portrait" />)}</div> : <div className="empty-state"><div className="empty-state-icon"><Sparkles size={22}/></div><h2>{type === "all" ? "Your next favorite is on its way." : `No ${types.find(item => item.value === type)?.label.toLowerCase()} content just yet.`}</h2><p>New content will appear here when it is published by Teens2Inspire.</p>{type !== "all" && <Link href="/app/explore">See all content</Link>}</div>}</main>;
}
