import Link from "next/link";
import { Play, Headphones, BookOpen, FileText, Bookmark } from "lucide-react";

type MediaCardProps = { id: string; title: string; description?: string | null; type: string; cover_url?: string | null; variant?: "landscape" | "portrait" };
const iconFor = (type: string) => type === "podcast" ? Headphones : type === "article" || type === "resource" ? BookOpen : type === "printable" ? FileText : Play;
export function MediaCard({ id, title, description, type, cover_url, variant = type === "podcast" ? "portrait" : "landscape" }: MediaCardProps) {
  const Icon = iconFor(type);
  return <Link className={`media-card ${variant === "portrait" ? "media-card-portrait" : ""}`} href={`/app/content/${id}`}>
    <div className={`media-card-art ${cover_url ? "has-cover" : `fallback-${type}`}`} style={cover_url ? { backgroundImage: `linear-gradient(0deg,rgba(22,9,17,.76),rgba(22,9,17,.02) 72%),url("${cover_url}")` } : undefined}>
      {!cover_url && <span className="fallback-monogram">{type === "podcast" ? "LISTEN" : type === "article" || type === "resource" ? "READ" : type === "printable" ? "SAVE" : "WATCH"}</span>}
      <span className="media-card-play" aria-hidden="true"><Icon size={15} fill={type === "video" ? "currentColor" : "none"}/></span>
      <span className="media-card-type">{type}</span>
    </div>
    <div className="media-card-copy"><h3>{title}</h3>{description && <p>{description}</p>}</div>
  </Link>;
}
