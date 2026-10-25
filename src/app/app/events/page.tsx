import Link from "next/link";
import { CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
export const metadata = { title: "Events | Teens2Inspire", description: "Events and programs from Teens2Inspire." };
export default async function AppEvents() {
  const { supabase } = await requireUser("/app/events");
  const { data, error } = await supabase.from("events").select("id,title,description,starts_at,ends_at,location,registration_url")
    .eq("status", "published").gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true });
  if (error) console.error("Events query failed", error.message);
  const items = data || [];
  return <main className="app-content app-page-content">
    <div className="page-intro"><span className="app-overline">GET TOGETHER</span><h1>Events</h1><p>Programs, gatherings, and experiences from Teens2Inspire.</p></div>
    {items.length ? <div className="events-library-grid">{items.map(event => <article className="events-library-card" key={event.id}>
      <div className="events-library-icon"><CalendarDays size={22}/></div><div className="events-library-date">{new Date(event.starts_at).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}</div>
      <h2>{event.title}</h2>{event.description && <p>{event.description}</p>}
      {event.location && <div className="events-library-location"><MapPin size={14}/>{event.location}</div>}
      {event.registration_url && <a className="app-primary-button" href={event.registration_url} target="_blank" rel="noreferrer">Registration details <ExternalLink size={14}/></a>}
    </article>)}</div> : <section className="empty-state"><div className="empty-state-icon"><CalendarDays size={22}/></div><h2>No upcoming events right now.</h2><p>Check back soon for the next Teens2Inspire gathering.</p><Link href="https://teens2inspire.org/events">Learn about upcoming programs</Link></section>}
  </main>;
}
