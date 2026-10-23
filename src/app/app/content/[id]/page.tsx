import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { SecurePlayer } from "@/components/secure-player";
import { addFavorite, removeFavorite } from "@/app/app/library/actions";
export default async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await requireUser(`/app/content/${id}`);
  const { data } = await supabase.from("content").select("id,title,description,body,type,cover_url,member_only,external_url,r2_media_key").eq("id", id).eq("status", "published").maybeSingle();
  if (!data) notFound();
  const { data: saved } = await supabase.from("favorites").select("content_id").eq("user_id", user!.id).eq("content_id", data.id).maybeSingle();
  const hasAccess = profile?.membership_status === "active";
  return <main className="app-content app-page-content content-detail">
    <Link className="back-to-library" href="/app"><ArrowLeft size={15}/> Back to explore</Link>
    {data.member_only && !hasAccess ? <section className="download-detail-card"><div><span className="content-type-line">MEMBERS-ONLY CONTENT</span><h2>{data.title}</h2><p>This item is available to active members and eligible school accounts. Join or sign in with an eligible account to access the full content.</p><Link className="app-primary-button" href="https://teens2inspire.org/membership">View membership options</Link></div></section> : data.type === "printable" || data.type === "resource" ? <section className="download-detail-card">{data.cover_url && <img src={data.cover_url} alt={`${data.title} cover`} className="download-detail-cover"/>}<div><span className="content-type-line">{data.type === "printable" ? "PRINTABLE DOWNLOAD" : "RESOURCE"}</span><h2>{data.title}</h2><p>{data.description}</p>{(data.r2_media_key || data.external_url) && <a className="app-primary-button" href={data.r2_media_key ? `/api/media/playback/${data.id}?download=1` : data.external_url!} target="_blank" rel="noreferrer">{data.type === "printable" ? "Open printable PDF" : "Open resource"} ↗</a>}</div></section> : data.type === "article" || data.type === "recipe" ? <>{data.cover_url && <img src={data.cover_url} alt="" className="article-detail-cover"/>}<div className="article-reading-content">{data.body ? data.body.split("\n").map((line:string,i:number)=>line.trim()?<p key={i}>{line}</p>:<br key={i}/>) : data.description && <p>{data.description}</p>}</div></> : data.type === "podcast" && data.external_url && /^https:\/\/player\.rss\.com\/teens2inspire\/[A-Za-z0-9_-]+(?:\?.*)?$/.test(data.external_url) ? <div className="rss-episode-player"><iframe src={data.external_url} title={`${data.title} — Teens2Inspire episode player`} width="100%" height="202" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/><p>Episode player provided by RSS.com.</p></div> : <SecurePlayer contentId={data.id} poster={data.cover_url} type={data.type}/> }
    <div className="content-detail-copy"><div className="content-type-line"><span className="content-type-dot"/>{data.type}{data.member_only && <span className="members-only-label">MEMBERS ONLY</span>}</div><h1>{data.title}</h1>{data.description && <p className="content-description">{data.description}</p>}
      {!(data.member_only && !hasAccess) && <div className="content-detail-actions">{saved ? <form action={removeFavorite}><input type="hidden" name="content_id" value={data.id}/><button className="app-secondary-button" type="submit"><Bookmark size={14} fill="currentColor"/> Remove from My List</button></form> : <form action={addFavorite}><input type="hidden" name="content_id" value={data.id}/><button className="app-secondary-button" type="submit"><Bookmark size={14}/> Save to My List</button></form>}
      </div>}
    </div>
  </main>;
}
