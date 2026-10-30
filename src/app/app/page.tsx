import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAppLanguage } from "@/lib/app-language";
import { localizeContentRows } from "@/lib/localized-content";
import { MediaCard } from "@/components/media-card";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { switchFamilyProfile, switchToOwnerProfile } from "./profile/actions";

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
  const { supabase, profile, user } = await requireUser("/app");
  const initialCookies = await cookies();
  if (profile?.membership_tier === "family" && profile?.membership_status === "active" && initialCookies.get("t2i-picker-dismissed")?.value !== "1") redirect("/app/profiles");

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

  const appLanguage = await getAppLanguage(supabase, user!.id);
  const items = await localizeContentRows(supabase, (content || []) as MediaItem[], appLanguage);
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

      const translatedItems = await localizeContentRows(supabase, (mappedItems.data || []) as MediaItem[], appLanguage);
      const lookup = new Map(translatedItems.map((item) => [item.id, item]));

      return {
        id: section.id,
        title: section.name,
        description: section.description,
        items: ids.map((id) => lookup.get(id)).filter(Boolean) as MediaItem[],
      };
    })
  );

  const cookieStore = await cookies();
  const selectedId = cookieStore.get("t2i-active-family-profile")?.value;
  let activeName = profile?.display_name || "";
  if (selectedId && selectedId !== "owner" && profile?.membership_tier === "family" && profile?.membership_status === "active") {
    const { data } = await supabase.from("family_profiles").select("display_name").eq("id", selectedId).eq("owner_id", user!.id).maybeSingle();
    if (data?.display_name) activeName = data.display_name;
  }
  const name = activeName.trim().split(" ")[0];
  return <main className="app-content app-home t2i-stream-home">
    <section className="t2i-stream-welcome"><div><span className="t2i-stream-overline">YOUR TEENS2INSPIRE</span><h1>{name ? `Hi, ${name}.` : "Welcome to Teens2Inspire."}</h1><p>Something good is always worth discovering.</p></div><Link className="t2i-stream-explore-link" href="/app/explore">Browse all <ArrowRight size={17}/></Link></section>
    <FeaturedCarousel items={[...items.filter(item=>item.featured), ...items.filter(item=>!item.featured)].slice(0,4)} />
    <section className="t2i-stream-category-area"><div className="t2i-stream-category-title"><strong>Explore what inspires you</strong><span>Find your next favorite.</span></div><nav className="t2i-stream-category-scroll" aria-label="Content categories">{[{label:"All",href:"/app/explore"},{label:"Videos",href:"/app/explore?type=video"},{label:"Podcasts",href:"/app/explore?type=podcast"},{label:"Articles",href:"/app/explore?type=article"},{label:"Printables",href:"/app/explore?type=printable"},{label:"Recipes",href:"/app/explore?type=recipe"},{label:"Resources",href:"/app/explore?type=resource"},{label:"Events",href:"/app/events"}].map(item=><Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></section>
    {shelves.filter(shelf=>shelf.items.length > 0).map((shelf) => <section className="app-shelf t2i-stream-shelf" key={shelf.id}><div className="shelf-heading"><div><h2>{shelf.title}</h2>{shelf.description && <p>{shelf.description}</p>}</div><Link href="/app/explore">See all <ArrowRight size={16}/></Link></div><div className="media-shelf-row">{shelf.items.map(item=><MediaCard key={item.id} {...item}/>)}</div></section>)}
    <section className="app-shelf t2i-stream-shelf"><div className="shelf-heading"><div><h2>Recently added</h2><p>Fresh from your library.</p></div><Link href="/app/explore">See all <ArrowRight size={16}/></Link></div>{items.length ? <div className="media-shelf-row">{items.slice(0,14).map(item=><MediaCard key={item.id} {...item}/>)}</div> : <div className="t2i-stream-empty"><h3>Great things are coming.</h3><p>New content will appear here as it’s published to Teens2Inspire.</p><Link href="/app/explore">Explore the library <ArrowRight size={15}/></Link></div>}</section>
    <section className="t2i-stream-community"><span>MORE TO DISCOVER</span><h2>A little inspiration, wherever you go.</h2><p>New conversations, meaningful stories, and original content — all in one thoughtful space.</p><Link href="/app/library">Your saved library <ArrowRight size={17}/></Link></section>
  </main>;
}
