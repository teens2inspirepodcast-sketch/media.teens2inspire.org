import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, CalendarDays, Clock3, LockKeyhole } from "lucide-react";
import { notFound } from "next/navigation";
import { getContentBySlug, getPublishedContent, contentTypeLabels, formatDuration } from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";
import { MediaPlayer } from "@/components/media-player";
import { FavoriteButton } from "@/components/favorite-button";
import { Artwork } from "@/components/artwork";
import { ContentShelf } from "@/components/content-card";
import { createServerSupabase } from "@/lib/supabase/server";

export async function ContentDetail({ slug, basePath = "/content" }: { slug: string; basePath?: string }) {
  const item = await getContentBySlug(slug);
  if (!item) {
    return <main className="access-page"><span className="eyebrow eyebrow-gold">A little more to explore</span><h1>This one needs<br /><em>a member key.</em></h1><p>Sign in with a Teens2Inspire account or explore membership for access to the full library.</p><div className="hero-actions"><Link href={`/signup?next=${encodeURIComponent(`${basePath}/${slug}`)}`} className="button button-primary">Explore membership <span aria-hidden="true">→</span></Link><Link href={basePath.startsWith("/v2") ? "/v2/discover" : "/discover"} className="text-link">Back to discovery</Link></div></main>;
  }
  if (item.status !== "published") notFound();
  const user = await getCurrentUser();
  const [related, progressResult] = await Promise.all([
    getPublishedContent({ category: item.category ?? undefined, type: item.type, limit: 6 }),
    user ? createServerSupabase().then((db) => db.from("media_progress").select("position_seconds").eq("content_id", item.id).eq("user_id", user.id).maybeSingle()) : Promise.resolve({ data: null }),
  ]);
  const more = related.filter((candidate) => candidate.id !== item.id).slice(0, 5);
  const date = item.published_at ? new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(item.published_at)) : null;
  const source = item.r2_media_key || item.media_url ? `/api/media/${item.id}` : null;

  return (
    <main className="content-detail-page">
      <div className="detail-back"><Link className="text-link" href={basePath === "/v2/content" ? "/v2/discover" : "/discover"}><ArrowLeft size={15} aria-hidden="true" /> Back to discovery</Link><FavoriteButton contentId={item.id} /></div>
      <header className="detail-heading"><span className="eyebrow eyebrow-gold">{item.category || contentTypeLabels[item.type] || "From the library"}</span><h1>{item.title}</h1><p className="detail-dek">{item.short_description || item.description}</p><div className="detail-meta">{item.creator_name && <span>{item.creator_name}</span>}{date && <span><CalendarDays size={14} aria-hidden="true" />{date}</span>}{item.duration_seconds && <span><Clock3 size={14} aria-hidden="true" />{formatDuration(item.duration_seconds)}</span>}{item.member_only && <span><LockKeyhole size={13} aria-hidden="true" />Member story</span>}</div></header>
      <div className="detail-artwork"><Artwork item={item} className="detail-art" priority /></div>
      {source && (item.type === "podcast" || item.type === "video") && <section className="detail-player" aria-label={item.type === "video" ? "Video player" : "Podcast player"}><MediaPlayer contentId={item.id} src={source} kind={item.type === "video" ? "video" : "audio"} resumeAt={progressResult.data?.position_seconds ?? 0} /></section>}
      <div className="detail-body-grid"><article className="detail-body"><span className="eyebrow">Stay a moment</span>{item.body ? <div className="rich-text">{item.body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : <p>{item.description || "Explore this Teens2Inspire story and keep a favorite idea close for later."}</p>}{source && item.type !== "podcast" && item.type !== "video" && <a href={source} className="button button-secondary resource-download"><ArrowDownToLine size={15} aria-hidden="true" /> Open or download this resource</a>}{item.external_url && <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="text-link">Continue with the creator <ArrowUpRight size={14} aria-hidden="true" /></a>}</article><aside className="detail-aside"><span className="eyebrow">A little more</span><h2>Keep this one close.</h2><p>Save it to your library and come back whenever you like.</p><FavoriteButton contentId={item.id} className="detail-save" />{!user && <Link href="/login" className="text-link">Sign in to save your place <span aria-hidden="true">→</span></Link>}</aside></div>
      <ContentShelf title="Keep exploring" items={more} basePath={basePath} />
    </main>
  );
}
