import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { MediaCard } from "@/components/media-card";

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  cover_url: string | null;
  featured?: boolean;
};
type Shelf = {
  id: string;
  title: string;
  description: string | null;
  items: MediaItem[];
};

export default async function AppHome() {
  const { supabase, profile } = await requireUser("/app");

  const [{ data: content, error: contentError }, { data: sections, error: sectionsError }] =
    await Promise.all([
      supabase
        .from("content")
        .select("id,title,description,type,cover_url,featured,member_only")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(60),
      // Use the real schema names from the deployed Supabase project.
      supabase
        .from("sections")
        .select("id,name,description,display_order")
        .eq("is_active", true)
        .order("display_order"),
    ]);

  if (contentError) console.error("Media library query failed", contentError.message);
  if (sectionsError) console.error("Media sections query failed", sectionsError.message);

  const items = (content || []) as MediaItem[];
  const hero = items.find((item) => item.featured) || items[0];

  const shelves: Shelf[] = await Promise.all(
    (sections || []).map(async (section) => {
      const { data: mappings, error: mappingError } = await supabase
        .from("section_content")
        .select("content_id,display_order")
        .eq("section_id", section.id)
        .order("display_order");

      if (mappingError) console.error("Section mapping query failed", mappingError.message);

      const ids = (mappings || []).map((row) => row.content_id);
      const mappedItems = ids.length
        ? await supabase
            .from("content")
            .select("id,title,description,type,cover_url")
            .in("id", ids)
            .eq("status", "published")
        : { data: [] as MediaItem[] };

      const lookup = new Map(
        ((mappedItems.data || []) as MediaItem[]).map((item) => [item.id, item])
      );

      return {
        id: section.id,
        title: section.name,
        description: section.description,
        items: ids.map((id) => lookup.get(id)).filter(Boolean) as MediaItem[],
      };
    })
  );

  const name = profile?.display_name?.trim().split(" ")[0];

  return (
    <main className="app-content app-home">
      <div className="app-greeting">
        <div>
          <span className="app-overline">YOUR LITTLE CORNER OF THE INTERNET</span>
          <h1>{name ? `Hi, ${name}.` : "A little inspiration, just for you."}</h1>
          <p>Find something meaningful to watch, listen to, or read today.</p>
        </div>
        <div className="greeting-sparkle"><Sparkles size={20} /></div>
      </div>

      {hero ? (
        <section
          className="featured-panel"
          style={hero.cover_url ? {
            backgroundImage: `linear-gradient(90deg,rgba(28,8,19,.86) 0%,rgba(28,8,19,.47) 52%,rgba(28,8,19,.04) 100%),linear-gradient(0deg,rgba(28,8,19,.5),transparent 55%),url("${hero.cover_url}")`,
          } : undefined}
        >
          {!hero.cover_url && <div className="featured-fallback-logo"><Image src="/teens2inspire-logo.png" alt="Teens2Inspire" width={520} height={170} /></div>}
          <div className="featured-copy">
            <span className="featured-label"><span /> FEATURED FOR YOU</span>
            <h2>{hero.title}</h2>
            <p>{hero.description || "A conversation worth coming back to."}</p>
            <div className="featured-actions">
              <Link className="app-primary-button" href={`/app/content/${hero.id}`}>
                <Play size={15} fill="currentColor" />
                {hero.type === "podcast" ? "Listen now" : hero.type === "article" || hero.type === "resource" ? "Read now" : "Watch now"}
              </Link>
              <span className="featured-kind">{hero.type}</span>
            </div>
          </div>
          <div className="featured-side-note"><span>THE TEENS2INSPIRE EDIT</span><b>Stories with<br />something to say.</b></div>
        </section>
      ) : (
        <section className="featured-panel featured-empty">
          <div className="featured-copy">
            <span className="featured-label"><span /> WELCOME TO TEENS2INSPIRE</span>
            <h2>A little inspiration<br />goes a long way.</h2>
            <p>Your media library is being curated. New episodes and stories will appear here as they are published.</p>
            <Link className="app-primary-button" href="/app/explore">Explore the library <ArrowRight size={15} /></Link>
          </div>
          <div className="empty-feature-art"><div className="empty-feature-circle" /><span>WATCH · LISTEN · READ</span></div>
        </section>
      )}

      <section className="app-category-strip" aria-label="Explore categories">
        <span>EXPLORE BY FORMAT</span>
        <Link href="/app/explore?type=video">Watch</Link>
        <Link href="/app/explore?type=podcast">Listen</Link>
        <Link href="/app/explore?type=article">Read</Link>
        <Link href="/app/explore?type=resource">Resources</Link>
        <Link href="/app/explore?type=printable">Printables</Link>
        <Link href="/app/explore?type=recipe">Recipes</Link>
        <Link href="/app/explore?type=pick">Picks</Link>
        <Link href="/app/events">Events</Link>
        <Link href="/app/explore?type=original">Originals</Link>
      </section>

      {shelves.map((shelf) => (
        <section className="app-shelf" key={shelf.id}>
          <div className="shelf-heading">
            <div><h2>{shelf.title}</h2>{shelf.description && <p>{shelf.description}</p>}</div>
            {shelf.items.length > 0 && <Link href="/app/explore">View all <ArrowRight size={14} /></Link>}
          </div>
          {shelf.items.length
            ? <div className="media-shelf-row">{shelf.items.map((item) => <MediaCard key={item.id} {...item} />)}</div>
            : <p className="shelf-empty">New additions will appear here as this collection grows.</p>}
        </section>
      ))}

      {!shelves.length && items.length > 0 && (
        <section className="app-shelf">
          <div className="shelf-heading">
            <div><h2>Latest releases</h2><p>Fresh from the Teens2Inspire library.</p></div>
            <Link href="/app/explore">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="media-shelf-row">{items.map((item) => <MediaCard key={item.id} {...item} />)}</div>
        </section>
      )}

      {!items.length && (
        <section className="empty-library-panel">
          <div className="empty-library-mark"><Sparkles size={22} /></div>
          <div><h2>Good things are on the way.</h2><p>There is no published content yet. Check back soon, or explore the available collections.</p></div>
          <Link className="app-secondary-button" href="/app/explore">Explore content <ArrowRight size={15} /></Link>
        </section>
      )}

      <footer className="app-footer">
        <span>Teens2Inspire</span><span>Inspiring Jewish teen girls.</span>
        <Link href="https://teens2inspire.org">About the platform</Link>
      </footer>
    </main>
  );
}
