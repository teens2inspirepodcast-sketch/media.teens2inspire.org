"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Headphones, Play } from "lucide-react";

type FeaturedItem = { id: string; title: string; slug: string; type: string; category: string | null; description: string; artwork: string | null };

export default function FeaturedCarousel({ items }: { items: FeaturedItem[] }) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => setActive((index) => (index + 1) % items.length), 7000);
    return () => window.clearInterval(interval);
  }, [items.length]);

  if (!items.length) return <section className="hero"><div><div className="eyebrow">Teens2Inspire Media</div><h1>Your space to listen, watch, read, and grow.</h1><p>Explore real Teens2Inspire content, all in one place.</p><Link className="btn primary" href="/listen">Start exploring <ArrowRight size={16} /></Link></div><div className="hero-art"><div className="hero-copy"><div className="eyebrow">Teens2Inspire</div><strong>Made for your kind of curious.</strong></div></div></section>;

  const item = items[active] || items[0];
  const isAudio = item.type === "podcast";
  const actionLabel = isAudio ? "Listen now" : item.type === "video" ? "Watch now" : "Explore story";
  const ActionIcon = isAudio ? Headphones : Play;
  const previous = () => setActive((index) => (index - 1 + items.length) % items.length);
  const next = () => setActive((index) => (index + 1) % items.length);

  return <section className="featured-carousel" aria-label="Featured Teens2Inspire content" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(distance) > 45) distance < 0 ? next() : previous(); touchStart.current = null; }}>
    <div className="featured-image" style={item.artwork ? { backgroundImage: `linear-gradient(90deg,rgba(25,16,23,.86) 0%,rgba(25,16,23,.52) 42%,rgba(25,16,23,.08) 100%),linear-gradient(0deg,rgba(25,16,23,.68),transparent 55%),url("${item.artwork}")` } : undefined} />
    <div className="featured-copy" key={item.id}>
      <span className="eyebrow">Featured on Teens2Inspire</span>
      <p className="featured-category">{item.category || item.type}</p>
      <h1>{item.title}</h1>
      <p className="featured-description">{item.description || "Conversations, stories, and ideas made for Jewish teen girls."}</p>
      <div className="featured-actions"><Link className="btn primary" href={`/content/${item.slug}`}><ActionIcon size={17} />{actionLabel}</Link><Link className="btn featured-secondary" href="/search">Explore all <ArrowRight size={16} /></Link></div>
    </div>
    {items.length > 1 && <div className="featured-controls"><div className="featured-dots" role="group" aria-label="Choose featured content">{items.map((entry, index) => <button key={entry.id} type="button" className={index === active ? "featured-dot active" : "featured-dot"} aria-label={`Show featured item ${index + 1}: ${entry.title}`} aria-pressed={index === active} onClick={() => setActive(index)} />)}</div><span>{String(active + 1).padStart(2, "0")} <span className="featured-counter-divider">/</span> {String(items.length).padStart(2, "0")}</span></div>}
  </section>;
}
