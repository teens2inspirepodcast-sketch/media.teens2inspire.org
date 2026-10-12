import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { SecurePlayer } from "@/components/secure-player";
import { addFavorite, removeFavorite } from "@/app/app/library/actions";
export default async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await requireUser(`/app/content/${id}`);
  const { data } = await supabase.from("content").select("id,title,description,type,cover_url,member_only").eq("id", id).eq("status", "published").maybeSingle();
  if (!data) notFound();
  const { data: saved } = await supabase.from("favorites").select("content_id").eq("user_id", user!.id).eq("content_id", data.id).maybeSingle();
  const hasAccess = profile?.membership_status === "active";
  return <main className="app-content app-page-content content-detail">
    <Link className="back-to-library" href="/app"><ArrowLeft size={15}/> Back to explore</Link>
    <SecurePlayer contentId={data.id} poster={data.cover_url}/>
    <div className="content-detail-copy"><div className="content-type-line"><span className="content-type-dot"/>{data.type}{data.member_only && <span className="members-only-label">MEMBERS ONLY</span>}</div><h1>{data.title}</h1>{data.description && <p className="content-description">{data.description}</p>}
      <div className="content-detail-actions">{saved ? <form action={removeFavorite}><input type="hidden" name="content_id" value={data.id}/><button className="app-secondary-button" type="submit"><Bookmark size={14} fill="currentColor"/> Remove from My List</button></form> : <form action={addFavorite}><input type="hidden" name="content_id" value={data.id}/><button className="app-secondary-button" type="submit"><Bookmark size={14}/> Save to My List</button></form>}
      {data.member_only && !hasAccess && <Link className="app-primary-button" href="https://teens2inspire.org/membership">Unlock with membership</Link>}</div>
      {data.member_only && !hasAccess && <p className="content-access-note">This episode is part of the member library. An active membership or participating-school access is required to play it.</p>}
    </div>
  </main>;
}
