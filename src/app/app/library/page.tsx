import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { removeFavorite } from "./actions";
export default async function Library({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const { supabase, user } = await requireUser("/app/library"); const params = await searchParams;
  const { data: saved } = await supabase.from("favorites").select("content_id,created_at").eq("user_id", user!.id).order("created_at", { ascending: false });
  const ids = (saved || []).map(item => item.content_id);
  const { data: items } = ids.length ? await supabase.from("content").select("id,title,description,type,cover_url").in("id", ids).eq("status", "published") : { data: [] as any[] };
  const byId = new Map((items || []).map(item => [item.id, item]));
  const ordered = ids.map(id => byId.get(id)).filter(Boolean) as Array<{id:string;title:string;description:string;type:string;cover_url:string|null}>;
  return <main className="app-content"><h1 style={{ fontSize: 48 }}>Your Library</h1><p>Your saved favorites, all in one place.</p>{params.updated && <p className="notice">Library updated.</p>}
    {ordered.length ? <div className="grid">{ordered.map(item=><article className="card" key={item.id}><div className="eyebrow">{item.type}</div><h3>{item.title}</h3><p>{item.description}</p><div className="actions"><Link className="btn primary" href={`/app/content/${item.id}`}>Open</Link><form action={removeFavorite}><input type="hidden" name="content_id" value={item.id}/><button className="btn secondary">Remove</button></form></div></article>)}</div> : <div className="panel"><h2 style={{fontSize:30}}>Your library is waiting.</h2><p>Explore the collection and save the episodes you want to come back to.</p><Link className="btn primary" href="/app/explore">Explore content</Link></div>}
  </main>;
}
