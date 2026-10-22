import Link from "next/link";
import { Bookmark } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { removeFavorite } from "./actions";
import { MediaCard } from "@/components/media-card";
export default async function Library({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const { supabase, user } = await requireUser("/app/library"); const params = await searchParams;
  const { data: saved } = await supabase.from("favorites").select("content_id,created_at").eq("user_id", user!.id).order("created_at", { ascending: false });
  const ids = (saved || []).map(item => item.content_id);
  const { data: items } = ids.length ? await supabase.from("content").select("id,title,description,type,cover_url").in("id", ids).eq("status", "published") : { data: [] as any[] };
  const byId = new Map((items || []).map(item => [item.id, item]));
  const ordered = ids.map(id => byId.get(id)).filter(Boolean) as Array<{id:string;title:string;description:string;type:string;cover_url:string|null}>;
  return <main className="app-content app-page-content"><div className="page-intro"><span className="app-overline">KEPT CLOSE, JUST FOR YOU</span><h1>My List</h1><p>Your saved favorites, all in one place.</p></div>{params.updated && <p className="app-notice">Your list has been updated.</p>}
    {ordered.length ? <div className="media-library-grid">{ordered.map(item=><article className="saved-card" key={item.id}><MediaCard {...item} variant="portrait"/><form action={removeFavorite}><input type="hidden" name="content_id" value={item.id}/><button className="remove-saved" type="submit">Remove from my list</button></form></article>)}</div> : <div className="empty-state"><div className="empty-state-icon"><Bookmark size={22}/></div><h2>Your list is waiting.</h2><p>When you find something you want to come back to, save it here.</p><Link href="/app/explore">Explore the library</Link></div>}
  </main>;
}
