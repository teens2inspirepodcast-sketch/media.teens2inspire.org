import Link from "next/link";
import { contentArtwork, contentTypeLabels, formatDuration, type Content } from "@/lib/content";
import { FavoriteButton } from "@/components/favorite-button";

export function ContentCard({ item, showSave = false, basePath = "/content" }: { item: Content; showSave?: boolean; basePath?: string }) {
  const art = contentArtwork(item);
  return (
    <article className="card">
      <Link href={`${basePath}/${item.slug}`} aria-label={`Open ${item.title}`}>
        <div className="art">
          {art ? <img src={art} alt="" /> : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", padding: 18, textAlign: "center", fontFamily: "'Playfair Display',serif", fontSize: 22 }}>{item.title}</div>}
          {(item.type === "podcast" || item.type === "video") && <div className="play" aria-hidden="true">{item.type === "video" ? "▷" : "▶"}</div>}
        </div>
        <div className="meta">
          <div className="type">{contentTypeLabels[item.type] || item.type}{item.duration_seconds ? ` · ${formatDuration(item.duration_seconds)}` : ""}</div>
          <div className="title">{item.title}</div>
          {item.short_description && <div className="desc">{item.short_description}</div>}
        </div>
      </Link>
      {showSave && <FavoriteButton contentId={item.id} />}
    </article>
  );
}

export function ContentShelf({ title, items, basePath = "/content" }: { title: string; items: Content[]; basePath?: string }) {
  if (!items.length) return null;
  return (
    <section className="section">
      <div className="section-head"><h2>{title}</h2></div>
      <div className="shelf">{items.map((item) => <ContentCard key={item.id} item={item} basePath={basePath} />)}</div>
    </section>
  );
}

export default ContentCard;
