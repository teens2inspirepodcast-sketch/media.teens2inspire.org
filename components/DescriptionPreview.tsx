import Link from "next/link";

export function DescriptionPreview({ text, href, label }: { text: string; href: string; label: string }) {
  return <div className="description-preview"><p>{text}</p><Link href={href} aria-label={`See more: ${label}`}>See more</Link></div>;
}
