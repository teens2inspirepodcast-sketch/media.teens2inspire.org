import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SecurePlayer } from "@/components/secure-player";
import { addFavorite, removeFavorite } from "@/app/app/library/actions";

export default async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser(`/app/content/${id}`);
  const { data } = await supabase.from("content").select("id,title,description,type,cover_url,member_only").eq("id", id).eq("status", "published").maybeSingle();
  if (!data) notFound();
  const { data: saved } = await supabase.from("favorites").select("content_id").eq("user_id", (await supabase.auth.getUser()).data.user?.id || "").eq("content_id", data.id).maybeSingle();
  return <main className="app-content">
    <SecurePlayer contentId={data.id} poster={data.cover_url} />
    <div className="eyebrow" style={{ marginTop: 28 }}>{data.type}</div>
    <h1 style={{ fontSize: "clamp(32px,5vw,48px)" }}>{data.title}</h1>
    <p>{data.description}</p>
    {saved ? <form action={removeFavorite}><input type="hidden" name="content_id" value={data.id}/><button className="btn secondary">Remove from library</button></form> : <form action={addFavorite}><input type="hidden" name="content_id" value={data.id}/><button className="btn secondary">Save to my library</button></form>}
    {data.member_only && <p className="notice">Members-only content. <Link href="https://teens2inspire.org/membership">View membership options</Link>.</p>}
  </main>;
}
