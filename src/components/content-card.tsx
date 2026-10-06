import Link from "next/link";
import { contentArtwork, contentTypeLabels, formatDuration, type Content } from "@/lib/content";

type ContentCardProps = {
  item: Content;
  showSave?: boolean;
  basePath?: string;
};

export default function ContentCard({ item, basePath = "/content" }: ContentCardProps) {
  const art = contentArtwork(item);
  const href = `${basePath.replace(/\/$/, "")}/${item.slug}`;

  return (
    <Link className="card" href={href}>
      <div className="art">
        {art ? (
          <img src={art} alt="" />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              padding: 18,
              textAlign: "center",
              fontFamily: "'Playfair Display',serif",
              fontSize: 22,
            }}
          >
            {item.title}
          </div>
        )}
        {(item.type === "podcast" || item.type === "video") && (
          <div className="play">{item.type === "video" ? "▷" : "▶"}</div>
        )}
      </div>
      <div className="meta">
        <div className="type">
          {contentTypeLabels[item.type] || item.type}
          {item.duration_seconds ? ` · ${formatDuration(item.duration_seconds)}` : ""}
        </div>
        <div className="title">{item.title}</div>
        {item.short_description && <div className="desc">{item.short_description}</div>}
      </div>
    </Link>
  );
}

export function ContentShelf({
  title,
  items,
  basePath = "/content",
}: {
  title: string;
  items: Content[];
  basePath?: string;
}) {
  if (!items.length) return null;

  return (
    <section className="shelf" aria-labelledby={`shelf-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <div className="shelf-heading">
        <h2 id={`shelf-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{title}</h2>
      </div>
      <div className="content-grid content-grid-shelf">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} basePath={basePath} />
        ))}
      </div>
    </section>
  );
}
