"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

type Featured = { id: string; title: string; description?: string | null; type: string; cover_url?: string | null };
export function FeaturedCarousel({ items }: { items: Featured[] }) {
  const [active, setActive] = useState(0);
  const slides = items.length ? items.slice(0, 4) : [{ id: "", title: "A little inspiration goes a long way.", description: "Discover meaningful stories, conversations, and moments made just for you.", type: "video", cover_url: null }];
  const current = slides[Math.min(active, slides.length - 1)];
  return <section className="t2i-stream-hero-section" aria-label="Featured content">
    <div className="t2i-stream-hero" key={current.id} style={current.cover_url ? {backgroundImage:`linear-gradient(90deg,rgba(23,8,20,.89),rgba(27,9,23,.22)),url("${current.cover_url.replaceAll('"','%22')}")`} : undefined}>
      <div className="t2i-stream-feature-copy"><span className="t2i-stream-feature-kicker"><span/> FEATURED FOR YOU</span><h2>{current.title}</h2><p>{current.description || "Find something meaningful in the Teens2Inspire library."}</p><Link href={current.id ? `/app/content/${current.id}` : "/app/explore"} className="t2i-stream-play-cta"><Play size={17} fill="currentColor"/>{current.type === "podcast" ? "Listen now" : current.type === "article" || current.type === "recipe" ? "Read now" : "Explore now"}</Link></div><div className="t2i-stream-feature-credit">TEENS2INSPIRE ORIGINALS</div>
      {slides.length > 1 && <button type="button" className="t2i-carousel-next" aria-label="Next featured item" onClick={() => setActive(i=>(i+1)%slides.length)}><ArrowRight size={20}/></button>}
    </div>
    {slides.length > 1 && <div className="t2i-feature-dots" aria-label="Choose featured content">{slides.map((item,i)=><button type="button" key={item.id} onClick={() => setActive(i)} aria-label={`Show featured item ${i+1}: ${item.title}`} aria-current={active === i ? "true" : undefined} className={i===active ? "is-active" : ""}/>)}</div>}
  </section>;
}
