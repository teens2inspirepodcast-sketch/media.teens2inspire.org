import { requireAdmin } from "@/lib/auth";
import { createEvent, setEventStatus, updateEvent, deleteEvent } from "./actions";
import { EventFlyerUpload } from "@/components/event-flyer-upload";
export default async function EventsAdmin({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin(); const query = await searchParams;
  const { data } = await supabase.from("events").select("id,title,description,starts_at,ends_at,status,location,registration_url,image_url").order("starts_at");
  return <>
    <h1 style={{ fontSize: 42 }}>Events</h1><p>Create and publish events shown on the public website.</p>
    {query.error && <p className="notice" role="alert">{query.error === "invalid" ? "Check the event details and use HTTPS for registration links." : "The event could not be saved."}</p>}
    {(query.created || query.updated) && <p className="notice">Event changes saved.</p>}{query.deleted && <p className="notice">Event deleted.</p>}
    <section className="panel" style={{ margin: "22px 0" }}><h2 style={{ fontSize: 30 }}>Add event</h2>
      <form action={createEvent} className="admin-form">
        <label>Event title<input name="title" required maxLength={160}/></label>
        <label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <label>Start date and time<input name="starts_at" type="datetime-local" required/></label>
        <label>End date and time (optional)<input name="ends_at" type="datetime-local"/></label>
        <label>Location or online details<input name="location" maxLength={240}/></label>
        <label>Registration URL (HTTPS)<input name="registration_url" type="url"/></label>
        <EventFlyerUpload />
        <label className="wide">Description<textarea name="description" rows={3} maxLength={5000}/></label>
        <div className="wide"><button className="btn primary">Save event</button></div>
      </form>
    </section>
    <h2 style={{ fontSize: 30 }}>Manage existing events</h2><div style={{ display: "grid", gap: 18 }}>{(data || []).map(e=><details key={e.id} className="panel"><summary style={{ cursor: "pointer", fontWeight: 700 }}>{e.title} · {new Date(e.starts_at).toLocaleDateString()} · {e.status}</summary>
      <form action={updateEvent} className="admin-form" style={{ marginTop: 16 }}><input type="hidden" name="id" value={e.id}/>
        <label>Event title<input name="title" defaultValue={e.title} required maxLength={160}/></label><label>Status<select name="status" defaultValue={e.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <label>Start date and time<input name="starts_at" type="datetime-local" required defaultValue={new Date(e.starts_at).toISOString().slice(0,16)}/></label><label>End date and time<input name="ends_at" type="datetime-local" defaultValue={e.ends_at ? new Date(e.ends_at).toISOString().slice(0,16) : ""}/></label>
        <label>Location<input name="location" defaultValue={e.location || ""} maxLength={240}/></label><label>Registration URL<input name="registration_url" type="url" defaultValue={e.registration_url || ""}/></label>
        <EventFlyerUpload initialUrl={e.image_url || ""} /><label className="wide">Description<textarea name="description" rows={3} defaultValue={e.description || ""}/></label>
        <div className="wide"><button className="btn primary">Save edits</button></div></form>
      <form action={deleteEvent} style={{ marginTop: 12 }}><input type="hidden" name="id" value={e.id}/><button className="btn secondary">Delete event</button></form></details>)}</div>
  </>;
}
