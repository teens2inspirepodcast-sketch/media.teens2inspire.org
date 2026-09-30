import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedContent } from "@/lib/content";
import { getViewerAccess } from "@/lib/membership-access";
import { DescriptionPreview } from "@/components/DescriptionPreview";

export const metadata: Metadata = { title: "Events", description: "Discover ways to meet, learn and make memories together." };
function dateLabel(value?: string | null) { if (!value) return "Date coming soon"; return new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
function LockIcon() { return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 6V4.5a3.5 3.5 0 0 1 7 0V6h.75A1.75 1.75 0 0 1 14 7.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5A1.75 1.75 0 0 1 3.75 6zm1.5 0h4V4.5a2 2 0 0 0-4 0zM8 8.5a1.25 1.25 0 0 0-.75 2.25v1.5h1.5v-1.5A1.25 1.25 0 0 0 8 8.5" fill="currentColor"/></svg>; }

export default async function EventsPage() {
  const [all, access] = await Promise.all([getPublishedContent("event", 64), getViewerAccess()]);
  const now = new Date();
  const upcoming = all.filter((event) => !event.starts_at || new Date(event.ends_at || event.starts_at) >= now);
  const past = all.filter((event) => event.starts_at && new Date(event.ends_at || event.starts_at) < now);
  return <div className="library-page page-shell"><div className="page-intro"><span className="eyebrow eyebrow-line">The best parts happen together</span><h1>Come <em>together.</em></h1><p>Find your people, share a moment, and make a memory that feels like yours.</p></div>
    <section className="event-discovery"><div className="section-heading"><div><span className="eyebrow">Save a spot for something good</span><h2>Coming up</h2></div></div>
      {upcoming.length ? <div className="event-cards">{upcoming.map((event, index) => {
        const locked = Boolean(event.member_only) && !access.canAccessMembersContent;
        const detailHref = `/content/${event.slug}`;
        return <article className="event-card" key={event.id}>
          <Link href={detailHref} className="event-image" aria-label={`Open event details for ${event.title}`}>
            {event.cover_url ? <img src={event.cover_url} alt="" loading="lazy" /> : <span>✳</span>}
            <span className="event-card-index">{String(index + 1).padStart(2, "0")}</span>
            {locked && <span className="media-lock" role="img" aria-label="Membership required"><LockIcon /></span>}
          </Link>
          <div className="event-card-copy"><span className="eyebrow muted">{event.category || "Teens2Inspire gathering"}</span><h3><Link href={detailHref}>{event.title}</Link></h3><div className="event-detail-line">{dateLabel(event.starts_at || event.published_at)}{event.location && <span> · {event.location}</span>}</div>
            {event.description && event.description.length > 70 && <DescriptionPreview text={event.description} href={detailHref} label={event.title} />}
            {locked ? <Link className="text-link" href={detailHref}>Membership details <span>↗</span></Link> : event.external_url ? <a className="text-link" href={event.external_url} target="_blank" rel="noreferrer">Event details <span>↗</span></a> : <Link className="text-link" href={detailHref}>Event details <span>↗</span></Link>}
          </div>
        </article>;
      })}</div> : <div className="empty-library"><span className="empty-sparkle">✳</span><h2>A gathering is in the making.</h2><p>We’ll share the details here as soon as the next event is ready.</p></div>}
    </section>
    {past.length > 0 && <section className="event-discovery past-events"><div className="section-heading"><div><span className="eyebrow">Memories we made</span><h2>Past events</h2></div></div><div className="past-event-list">{past.map((event) => <Link className="past-event-row" href={`/content/${event.slug}`} key={event.id}><span>{dateLabel(event.starts_at)}</span><b>{event.title}</b><i>↗</i></Link>)}</div></section>}
  </div>;
}
