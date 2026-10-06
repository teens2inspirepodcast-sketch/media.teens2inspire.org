import Image from "next/image";
import type { CSSProperties } from "react";
import type { Content } from "@/lib/content";
import { contentArtwork } from "@/lib/content";

const artDirections = ["art-rose", "art-olive", "art-ink", "art-sand"];

export function Artwork({ item, className = "", priority = false }: { item: Pick<Content, "cover_url" | "r2_thumbnail_key" | "title" | "id">; className?: string; priority?: boolean }) {
  const image = contentArtwork(item);
  const art = artDirections[(item.id.charCodeAt(0) || 0) % artDirections.length];
  return (
    <div className={`artwork ${art} ${className}`} style={{ "--art-seed": item.id.charCodeAt(0) % 7 } as CSSProperties} aria-label={image ? undefined : `${item.title} artwork`} role={image ? undefined : "img"}>
      {image && <Image src={image} alt="" fill sizes="(max-width: 700px) 70vw, 320px" priority={priority} />}
      {!image && <span className="artwork-letter" aria-hidden="true">{item.title.slice(0, 1).toUpperCase()}</span>}
      <span className="artwork-grain" aria-hidden="true" />
    </div>
  );
}

export function EditorialPhoto({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <div className={`editorial-photo ${className}`}><Image src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 52vw" /></div>;
}
