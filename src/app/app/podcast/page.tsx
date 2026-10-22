import Link from "next/link";
import { ArrowLeft, ArrowRight, Headphones } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { MediaCard } from "@/components/media-card";
export default async function PodcastPage() {
 const { supabase } = await requireUser("/app/podcast");
 const { data } = await supabase.from("content").select("id,title,description,type,cover_url").eq("type", "podcast").eq("status", "published").order("published_at", { ascending: false }).limit(60);
 const episodes = data || [];
 return <main className="app-content app-page-content podcast-hub">
  <Link className="back-to-library" href="/app"><ArrowLeft size={15}/> Back to home</Link>
  <section className="podcast-hub-hero"><span className="app-overline">THE TEENS2INSPIRE PODCAST</span><h1>Real conversations.<br/><em>Meaningful moments.</em></h1><p>Honest conversations, personal stories, and fresh perspectives from Jewish teen girls and the people who inspire them.</p><a className="app-primary-button" href="#episodes">Explore episodes <ArrowRight size={14}/></a></section>
  <section className="app-shelf podcast-hub-library" id="episodes"><div className="shelf-heading"><div><h2>Find a conversation that speaks to you.</h2><p>Browse the episode library and choose a topic.</p></div></div>{episodes.length ? <div className="media-library-grid">{episodes.map((item) => <MediaCard key={item.id} {...item} variant="portrait" />)}</div> : <div className="empty-state"><div className="empty-state-icon"><Headphones size={22}/></div><h2>New episodes are on the way.</h2><p>Published podcast episodes will appear here as they are added to the library.</p></div>}</section>
  <section className="podcast-hub-player"><div><span className="app-overline">THE FULL SHOW</span><h2>Listen on Spotify.</h2><p>Play the full Teens2Inspire Podcast directly here. The Spotify player updates as new episodes are published.</p><a className="app-secondary-button" href="https://open.spotify.com/show/4rpRDVE1wGkP8trMxKfxZo" target="_blank" rel="noreferrer">Open Spotify <ArrowRight size={14}/></a></div><div className="podcast-hub-embed"><iframe src="https://open.spotify.com/embed/show/4rpRDVE1wGkP8trMxKfxZo?utm_source=generator&theme=0" title="Teens2Inspire Podcast on Spotify" width="100%" height="520" frameBorder="0" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen/></div></section>
 </main>;
}
