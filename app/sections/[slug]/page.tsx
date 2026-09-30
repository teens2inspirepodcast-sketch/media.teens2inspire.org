import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicSection } from "@/lib/sections";
import { getViewerAccess } from "@/lib/membership-access";
import { MediaCard } from "@/components/MediaCard";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = await getPublicSection((await params).slug);
  if (!section) return { title: "Section not found" };
  return { title: section.name, description: section.description || `Explore ${section.name} on Teens2Inspire.`, alternates: { canonical: `/sections/${section.slug}` } };
}
export default async function SectionPage({ params }: Props) {
  const section = await getPublicSection((await params).slug);
  if (!section) notFound();
  const access = await getViewerAccess();
  return <div className="library-page page-shell section-page">
    <Link className="back-link" href="/">← Back to explore</Link>
    <header className="page-intro"><span className="eyebrow eyebrow-line">Teens2Inspire collection</span><h1>{section.name}</h1>{section.description && <p>{section.description}</p>}</header>
    {section.content.length ? <div className="resource-grid">{section.content.map((item) => <MediaCard key={item.id} item={item} canWatchVideos={access.canWatchVideos} />)}</div> : <div className="empty-library"><span className="empty-sparkle">✳</span><h2>Nothing here just yet.</h2><p>New Teens2Inspire content is coming soon.</p></div>}
  </div>;
}
