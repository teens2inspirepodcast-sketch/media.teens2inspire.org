import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { getPublishedContent, type ContentType } from "@/lib/content";
import { ContentCard } from "@/components/content-card";

export async function CatalogBrowser({ heading, intro, type, search, basePath = "", category, sort = "newest" }: {
  heading: string;
  intro: string;
  type?: ContentType | ContentType[];
  search?: string;
  basePath?: string;
  category?: string;
  sort?: "newest" | "featured";
}) {
  const typeList = Array.isArray(type) ? type : type ? [type] : undefined;
  const primaryType = typeList?.[0];
  const fetchedItems = await getPublishedContent({
    type: typeList?.length === 1 ? typeList[0] : undefined,
    types: typeList?.length && typeList.length > 1 ? typeList : undefined,
    search,
    category,
    limit: 48,
  });
  const items = sort === "featured"
    ? [...fetchedItems].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    : fetchedItems;
  const categories = Array.from(new Set(items.map((item) => item.category).filter((value): value is string => Boolean(value)))).sort();
  const routeFor = (kind: string) => {
    const root = basePath;
    if (kind === "all") return `${root}/discover`;
    if (kind === "podcast") return `${root}/podcasts`;
    if (kind === "video") return `${root}/videos`;
    if (kind === "article") return `${root}/articles`;
    if (kind === "resource" || kind === "printable") return `${root}/resources`;
    if (kind === "event") return `${root}/events`;
    return `${root}/discover`;
  };
  const contentBasePath = basePath ? `${basePath}/content` : "/content";
  return (
    <main className="catalog-page">
      <div className="page-intro"><span className="eyebrow">The Teens2Inspire library</span><h1>{heading}</h1><p>{intro}</p></div>
      <form className="catalog-search" action={routeFor(primaryType ?? "all")} role="search">
        <Search size={19} aria-hidden="true" /><label className="sr-only" htmlFor="content-search">Search stories, voices, and ideas</label>
        <input id="content-search" name="q" defaultValue={search ?? ""} placeholder="Search stories, voices, and ideas" />
        {category && <input name="category" type="hidden" value={category} />}
        <label className="sr-only" htmlFor="content-sort">Sort stories</label><select id="content-sort" name="sort" defaultValue={sort}><option value="newest">Newest first</option><option value="featured">Featured first</option></select>
        <button className="button button-primary button-small" type="submit">Search</button>
      </form>
      <div className="filter-row"><span><SlidersHorizontal size={15} aria-hidden="true" />Browse by format</span><div>{["all", "podcast", "video", "article", "resource", "printable", "event"].map((kind) => <Link key={kind} href={routeFor(kind)} className={(kind === "all" ? !primaryType : typeList?.includes(kind as ContentType)) ? "filter-active" : ""}>{kind === "all" ? "All" : kind[0].toUpperCase() + kind.slice(1)}</Link>)}</div></div>
      {categories.length > 0 && <div className="topic-row"><span>Topics</span>{categories.slice(0, 8).map((topic) => <Link key={topic} href={`${routeFor(primaryType ?? "all")}?${new URLSearchParams({ ...(search ? { q: search } : {}), category: topic, sort })}`} className={category === topic ? "filter-active" : ""}>{topic}</Link>)}</div>}
      {items.length ? <div className="content-grid">{items.map((item) => <ContentCard key={item.id} item={item} showSave basePath={contentBasePath} />)}</div> : <div className="empty-state"><span className="empty-rule" /><h2>{search ? "No stories found yet" : "Good things are taking shape"}</h2><p>{search ? "Try another title or browse a different format." : "There is not anything published here just yet. Check back soon for thoughtful reads, listens, and more."}</p><Link href={basePath ? `${basePath}/discover` : "/discover"} className="text-link">Back to all discovery <span aria-hidden="true">→</span></Link></div>}
    </main>
  );
}
