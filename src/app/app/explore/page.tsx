import Link from "next/link";
import { ArrowRight, Layers3, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getAppLanguage } from "@/lib/app-language";
import { localizeContentRows } from "@/lib/localized-content";
import { MediaCard } from "@/components/media-card";

const formats = [
  { label: "Watch", value: "video" },
  { label: "Listen", value: "podcast" },
  { label: "Read", value: "article" },
  { label: "Resources", value: "resource" },
  { label: "Printables", value: "printable" },
  { label: "Originals", value: "original" },
  { label: "Recipes", value: "recipe" },
  { label: "Picks", value: "pick" },
  { label: "Events", value: "event" },
] as const;

type SearchParams = { type?: string };

/** A directory of collections and formats; never aggregates all carousels into an Everything tab. */
export default async function Explore({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase, user } = await requireUser("/app/explore");
  const params = await searchParams;
  const format = formats.find(item => item.value === params.type);

  if (format?.value === "event") redirect("/app/events");

  const { data: sections } = await supabase.from("sections")
    .select("id,name,description,display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const { data: content, error } = format
    ? await supabase.from("content")
      .select("id,title,description,type,cover_url")
      .eq("status", "published")
      .eq("type", format.value)
      .order("published_at", { ascending: false })
      .limit(250)
    : { data: null, error: null };
  if (error) console.error("Content format lookup failed", error.message);
  const items = format
    ? await localizeContentRows(supabase, content || [], await getAppLanguage(supabase, user!.id))
    : [];

  return <main className="app-content app-page-content t2i-collections-page">
    <div className="page-intro">
      <span className="app-overline">FIND YOUR NEXT FAVORITE</span>
      <h1>{format ? format.label : "Explore collections"}</h1>
      <p>{format
        ? `Discover Teens2Inspire ${format.label.toLowerCase()} content.`
        : "Choose a collection to discover everything in that section."}</p>
    </div>
    <nav className="filter-pills" aria-label="Browse by content format">
      {formats.map(item => <Link
        href={item.value === "event" ? "/app/events" : `/app/explore?type=${item.value}`}
        key={item.value}
        className={format?.value === item.value ? "is-selected" : ""}
        aria-current={format?.value === item.value ? "page" : undefined}
      >{item.label}</Link>)}
    </nav>
    {format ? <>
      <Link className="t2i-collection-back" href="/app/explore">Browse collections <ArrowRight size={16}/></Link>
      {items.length
        ? <div className="media-library-grid">{items.map(item => <MediaCard key={item.id} {...item} variant="portrait" />)}</div>
        : <div className="empty-state"><div className="empty-state-icon"><Sparkles size={22}/></div><h2>No {format.label.toLowerCase()} content yet.</h2><p>Check back for new Teens2Inspire releases.</p><Link href="/app/explore">Browse collections</Link></div>}
    </> : <>
      <div className="t2i-collection-directory-heading"><h2>Our collections</h2><p>Each collection opens its own complete library.</p></div>
      {sections?.length
        ? <div className="t2i-collection-grid">{sections.map(section => <Link className="t2i-collection-tile" key={section.id} href={`/app/sections/${section.id}`}>
          <span className="t2i-collection-tile-icon"><Layers3 size={21} /></span>
          <strong data-no-translate>{section.name}</strong>
          {section.description && <p data-no-translate>{section.description}</p>}
          <span className="t2i-collection-tile-link">Explore this collection <ArrowRight size={17} /></span>
        </Link>)}</div>
        : <div className="empty-state"><div className="empty-state-icon"><Sparkles size={22}/></div><h2>New collections are on the way.</h2><p>Choose a format above to browse available content.</p></div>}
    </>}
  </main>;
}
