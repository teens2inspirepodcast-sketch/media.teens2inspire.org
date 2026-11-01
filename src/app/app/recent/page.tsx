import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAppLanguage } from "@/lib/app-language";
import { localizeContentRows } from "@/lib/localized-content";
import { MediaCard } from "@/components/media-card";

const PAGE_SIZE = 48;
export default async function RecentReleases({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase, user } = await requireUser("/app/recent");
  const requested = Number((await searchParams).page || "1");
  const page = Number.isSafeInteger(requested) && requested > 0 && requested <= 1000 ? requested : 1;
  const start = (page - 1) * PAGE_SIZE;
  const { data, error } = await supabase.from("content")
    .select("id,title,description,type,cover_url")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .range(start, start + PAGE_SIZE);
  if (error) console.error("Recent media lookup failed", error.message);
  const hasNext = (data || []).length > PAGE_SIZE;
  const items = await localizeContentRows(supabase, (data || []).slice(0, PAGE_SIZE), await getAppLanguage(supabase, user!.id));
  return <main className="app-content app-page-content t2i-collections-page">
    <Link href="/app" className="t2i-collection-back"><ArrowLeft size={16}/> Back to home</Link>
    <div className="page-intro"><span className="app-overline">FRESH FROM TEENS2INSPIRE</span><h1>Recently added</h1><p>Catch up on our newest releases.</p></div>
    {items.length ? <div className="media-library-grid">{items.map(item => <MediaCard key={item.id} {...item} variant="portrait" />)}</div>
      : <div className="empty-state"><div className="empty-state-icon"><Sparkles size={22}/></div><h2>No new releases yet.</h2><p>Check back soon for fresh content.</p></div>}
    {(page > 1 || hasNext) && <nav className="t2i-collection-pagination" aria-label="Recent releases pages">
      {page > 1 && <Link href={`/app/recent?page=${page - 1}`}><ArrowLeft size={16}/> Previous</Link>}
      <span>Page {page}</span>
      {hasNext && <Link href={`/app/recent?page=${page + 1}`}>Next <ArrowRight size={16}/></Link>}
    </nav>}
  </main>;
}
