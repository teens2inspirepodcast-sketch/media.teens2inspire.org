import Link from "next/link";
import { Play } from "lucide-react";
import { requireUser } from "@/lib/auth";

type MediaItem = { id: string; title: string; description: string; type: string; cover_url: string | null; featured?: boolean };
export default async function AppHome() {
  const { supabase } = await requireUser("/app");
  const [{ data: content }, { data: sections }] = await Promise.all([
    supabase.from("content").select("id,title,description,type,cover_url,featured,member_only").eq("status", "published").order("published_at", { ascending: false }).limit(60),
    supabase.from("sections").select("id,title,description,sort_order").eq("is_published", true).order("sort_order"),
  ]);
  const items = (content || []) as MediaItem[]; const hero = items.find(item => item.featured) || items[0];
  const shelves = await Promise.all((sections || []).map(async section => {
    const { data: mappings } = await supabase.from("section_content").select("content_id,sort_order").eq("section_id", section.id).order("sort_order");
    const ids = (mappings || []).map(row => row.content_id);
    const mappedItems = ids.length ? await supabase.from("content").select("id,title,description,type,cover_url").in("id", ids).eq("status", "published") : { data: [] as MediaItem[] };
    const lookup = new Map(((mappedItems.data || []) as MediaItem[]).map(item => [item.id, item]));
    return { id: section.id, title: section.title, description: section.description, items: ids.map(id => lookup.get(id)).filter(Boolean) as MediaItem[] };
  }));
  return <main className="app-content">
    {hero ? <section className="app-hero"><div className="app-hero-copy"><div className="eyebrow" style={{ color: "#f1dbe3" }}>FEATURED FOR YOU</div><h1>{hero.title}</h1><p>{hero.description}</p><Link className="btn" style={{ background: "#fff", color: "#541c30" }} href={`/app/content/${hero.id}`}><Play size={16}/> Watch now</Link></div></section> : <section className="app-hero"><div className="app-hero-copy"><div className="eyebrow" style={{ color: "#f1dbe3" }}>WELCOME TO TEENS2INSPIRE</div><h1>A little inspiration goes a long way.</h1><p>Your curated media library is getting ready. New content will appear here.</p></div></section>}
    {shelves.map(shelf => <section className="shelf" key={shelf.id}><h2>{shelf.title}</h2>{shelf.description && <p>{shelf.description}</p>}{shelf.items.length ? <div className="media-row">{shelf.items.map(item=><Link className="media-card" href={`/app/content/${item.id}`} key={item.id}><div className="media-thumb" style={item.cover_url ? { backgroundImage: `linear-gradient(0deg,#21101966,transparent 70%),url("${item.cover_url}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}}/><h3>{item.title}</h3><p>{item.type}</p></Link>)}</div> : <p style={{ color: "#786a70", fontSize: 13 }}>Content will appear here when it is assigned to this collection.</p>}</section>)}
    {!shelves.length && items.length > 0 && <section className="shelf"><h2>New releases</h2><div className="media-row">{items.map(item=><Link className="media-card" href={`/app/content/${item.id}`} key={item.id}><div className="media-thumb" style={item.cover_url ? { backgroundImage: `linear-gradient(0deg,#21101966,transparent 70%),url("${item.cover_url}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}}/><h3>{item.title}</h3><p>{item.type}</p></Link>)}</div></section>}
    {!items.length && <section className="panel" style={{ marginTop: 28 }}><h2 style={{ fontSize: 30 }}>Your library is being curated.</h2><p>New episodes and original content will appear here as the team publishes them.</p><Link className="btn secondary" href="/app/explore">Explore the library</Link></section>}
  </main>;
}
