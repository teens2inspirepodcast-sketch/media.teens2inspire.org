import Link from "next/link";
import { ArrowLeft, ArrowRight, Layers3 } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getAppLanguage } from "@/lib/app-language";
import { localizeContentRows } from "@/lib/localized-content";
import { MediaCard } from "@/components/media-card";

const PAGE_SIZE = 48;
type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> };
type SectionContent = { id: string; title: string; description: string | null; type: string; cover_url: string | null };

/** Show only the items assigned to the selected carousel, in editorial order. */
export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const { supabase, user } = await requireUser(`/app/sections/${id}`);
  const requested = Number((await searchParams).page || "1");
  const page = Number.isSafeInteger(requested) && requested > 0 && requested <= 1000 ? requested : 1;

  const { data: section, error: sectionError } = await supabase.from("sections")
    .select("id,name,description")
    .eq("id", id).eq("is_active", true).maybeSingle();
  if (sectionError) console.error("Collection lookup failed", sectionError.message);
  if (!section) notFound();

  const start = (page - 1) * PAGE_SIZE;
  const { data: mappings, error: mappingError } = await supabase.from("section_content")
    .select("content_id,display_order")
    .eq("section_id", id)
    .order("display_order", { ascending: true })
    .order("content_id", { ascending: true })
    .range(start, start + PAGE_SIZE);
  if (mappingError) console.error("Collection content lookup failed", mappingError.message);
  const pageMappings = (mappings || []).slice(0, PAGE_SIZE);
  const ids = pageMappings.map(row => row.content_id);
  const { data: content, error: contentError } = ids.length
    ? await supabase.from("content")
      .select("id,title,description,type,cover_url")
      .eq("status", "published")
      .in("id", ids)
    : { data: [] as SectionContent[], error: null };
  if (contentError) console.error("Collection media lookup failed", contentError.message);
  const language = await getAppLanguage(supabase, user!.id);
  const translated = await localizeContentRows(supabase, (content || []) as SectionContent[], language);
  const byId = new Map(translated.map(item => [item.id, item]));
  const ordered = ids.map(contentId => byId.get(contentId)).filter((item): item is SectionContent => Boolean(item));
  const hasNext = (mappings || []).length > PAGE_SIZE;

  return <main className="app-content app-page-content t2i-collections-page">
    <Link className="t2i-collection-back" href="/app"> <ArrowLeft size={16}/> Back to home</Link>
    <div className="page-intro t2i-collection-intro">
      <span className="app-overline">TEENS2INSPIRE COLLECTION</span>
      <h1 data-no-translate>{section.name}</h1>
      {section.description && <p data-no-translate>{section.description}</p>}
    </div>
    {ordered.length
      ? <div className="media-library-grid">{ordered.map(item => <MediaCard key={item.id} {...item} variant="portrait" />)}</div>
      : <div className="empty-state"><div className="empty-state-icon"><Layers3 size={22}/></div><h2>No published items here yet.</h2><p>New media will appear here when it becomes available.</p><Link href="/app/explore">Explore collections</Link></div>}
    {(page > 1 || hasNext) && <nav className="t2i-collection-pagination" aria-label="Collection pages">
      {page > 1 && <Link href={`/app/sections/${id}?page=${page - 1}`}><ArrowLeft size={16}/> Previous</Link>}
      <span>Page {page}</span>
      {hasNext && <Link href={`/app/sections/${id}?page=${page + 1}`}>Next <ArrowRight size={16}/></Link>}
    </nav>}
  </main>;
}
