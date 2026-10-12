import { requireAdmin } from "@/lib/auth";
import { createEvent, setEventStatus } from "./actions";
export default async function EventsAdmin({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; updated?: string }> }) {
  const { supabase } = await requireAdmin(); const query = await searchParams;
  const { data } = await supabase.from("events").select("id,title,starts_at,status,location").order("starts_at");
  return <>
    <h1 style={{ fontSize: 42 }}>Events</h1><p>Create and publish events shown on the public website.</p>
    {query.error && <p className="notice" role="alert">{query.error === "invalid" ? "Check the event details and use HTTPS for registration links." : "The event could not be saved."}</p>}
    {(query.created || query.updated) && <p className="notice">Event changes saved.</p>}
    <section className="panel" style={{ margin: "22px 0" }}><h2 style={{ fontSize: 30 }}>Add event</h2>
      <form action={createEvent} className="admin-form">
        <label>Event title<input name="title" required maxLength={160}/></label>
        <label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <label>Start date and time<input name="starts_at" type="datetime-local" required/></label>
        <label>End date and time (optional)<input name="ends_at" type="datetime-local"/></label>
        <label>Location or online details<input name="location" maxLength={240}/></label>
        <label>Registration URL (HTTPS)<input name="registration_url" type="url"/></label>
        <label className="wide">Description<textarea name="description" rows={3} maxLength={5000}/></label>
        <div className="wide"><button className="btn primary">Save event</button></div>
      </form>
    </section>
    <div className="table-wrap"><table><thead><tr><th>Title</th><th>Date</th><th>Location</th><th>Status</th><th>Change status</th></tr></thead><tbody>{(data || []).map(e=><tr key={e.id}><td>{e.title}</td><td>{new Date(e.starts_at).toLocaleString()}</td><td>{e.location || "—"}</td><td>{e.status}</td><td><form action={setEventStatus} className="inline-form"><input type="hidden" name="id" value={e.id}/><select name="status" defaultValue={e.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><button className="btn secondary">Save</button></form></td></tr>)}</tbody></table></div>
  </>;
}
