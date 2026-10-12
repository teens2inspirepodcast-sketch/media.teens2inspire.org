import Link from "next/link";
import { requireUser } from "@/lib/auth";
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase } = await requireUser("/app/search"); const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 100);
  let items: Array<{ id: string; title: string; description: string; type: string }> = [];
  if (query) {
    const safe = query.replace(/[%,_\\]/g, " ").trim();
    if (safe) {
      const { data } = await supabase.from("content").select("id,title,description,type").eq("status", "published").ilike("title", `%${safe}%`).order("published_at", { ascending: false }).limit(50);
      items = data || [];
    }
  }
  return <main className="app-content"><h1 style={{ fontSize: 48 }}>Search</h1><form method="get" action="/app/search" className="search-form"><label htmlFor="q">Find something meaningful</label><div><input id="q" name="q" defaultValue={query} placeholder="Search episodes, stories, topics…" maxLength={100}/><button className="btn primary">Search</button></div></form>
    {query && <p>{items.length ? `${items.length} result${items.length === 1 ? "" : "s"} for “${query}”` : `No title matches for “${query}”. Try another search.`}</p>}
    <div className="grid">{items.map(item=><Link className="card" href={`/app/content/${item.id}`} key={item.id}><div className="eyebrow">{item.type}</div><h3>{item.title}</h3><p>{item.description}</p></Link>)}</div>
  </main>;
}
