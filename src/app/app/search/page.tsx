import Link from "next/link";
import { Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAppLanguage } from "@/lib/app-language";
import { localizeContentRows } from "@/lib/localized-content";
import { MediaCard } from "@/components/media-card";
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase, user } = await requireUser("/app/search"); const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 100);
  let items: Array<{ id: string; title: string; description: string | null; type: string; cover_url: string | null }> = [];
  if (query) {
    const safe = query.replace(/[%,_\\]/g, " ").trim();
    if (safe) {
      const { data } = await supabase.from("content").select("id,title,description,type,cover_url").eq("status", "published").ilike("title", `%${safe}%`).order("published_at", { ascending: false }).limit(50);
      items = data || [];
    }
  }
  items = await localizeContentRows(supabase, items, await getAppLanguage(supabase,user!.id));
  return <main className="app-content app-page-content"><div className="page-intro"><span className="app-overline">FIND WHAT YOU NEED</span><h1>Search</h1><p>Look for a topic, a conversation, or a moment of perspective.</p></div><form method="get" action="/app/search" className="app-search-form"><label className="visually-hidden" htmlFor="q">Search the library</label><div><input id="q" name="q" defaultValue={query} placeholder="Friendship, confidence, emunah…" maxLength={100}/><button className="app-primary-button">Search</button></div></form>
    {query && <p className="search-summary">{items.length ? `${items.length} result${items.length === 1 ? "" : "s"} for “${query}”` : `No title matches for “${query}”. Try another search.`}</p>}
    {items.length ? <div className="media-library-grid">{items.map(item=><MediaCard key={item.id} {...item} variant="portrait" />)}</div> : <div className="empty-state"><div className="empty-state-icon search-empty"><Search size={22}/></div><h2>{query ? "Nothing came up this time." : "What are you in the mood for?"}</h2><p>{query ? "Try a different keyword, or explore all the content." : "Search the library by title to find your next watch, listen, or read."}</p>{query && <Link href="/app/explore">Explore all content</Link>}</div>}
  </main>;
}
