import Link from "next/link";
import MediaNav from "@/components/media-nav";
import MediaFooter from "@/components/media-footer";
import ContentCard from "@/components/content-card";
import { requireUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Content } from "@/lib/content";

export const metadata = { title: "Your Library | Teens2Inspire" };

export default async function SavedPage() {
  const user = await requireUser("/saved");
  const supabase = await createServerSupabase();
  const { data: favorites } = await supabase.from("favorites").select("content_id,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
  const ids = (favorites ?? []).map((favorite) => favorite.content_id);
  let items: Content[] = [];
  if (ids.length) {
    const { data } = await supabase.from("content").select("*").in("id", ids).eq("status", "published");
    const byId = new Map((data ?? []).map((item) => [item.id, item]));
    items = ids.map((id) => byId.get(id)).filter((item): item is Content => Boolean(item));
  }
  return <><MediaNav /><main className="shell page"><div className="eyebrow">Your library</div><h1 className="page-title">Saved for later</h1><p className="page-sub">The podcasts, videos, and resources you saved in one place.</p>{items.length ? <div className="content-grid" style={{ marginTop: 30 }}>{items.map((item) => <ContentCard key={item.id} item={item} />)}</div> : <section className="feature-card" style={{ marginTop: 28 }}><h2>Your library is ready for you.</h2><p>When you save something you want to revisit, it will appear here.</p><Link className="btn primary" href="/search">Explore content</Link></section>}</main><MediaFooter /></>;
}
