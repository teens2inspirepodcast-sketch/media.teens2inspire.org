import { requireAdmin } from "@/lib/auth";
import { createContent, setContentStatus } from "./actions";

export default async function ContentAdmin({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; updated?: string }> }) {
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const { data } = await supabase.from("content").select("id,title,type,status,updated_at,slug").order("updated_at", { ascending: false }).limit(100);
  const errorText: Record<string, string> = { invalid: "Check the required fields and use HTTPS for cover images.", "duplicate-slug": "That slug is already in use. Choose a unique slug.", "save-failed": "The change could not be saved." };
  return <>
    <h1 style={{ fontSize: 42 }}>Content Studio</h1>
    <p>Create content records and publish/unpublish items. For audio/video, set the media asset key to the exact private object key in your configured Cloudflare R2 bucket. Uploads are managed in Cloudflare R2.</p>
    {query.error && <p className="notice" role="alert">{errorText[query.error] || "Something went wrong."}</p>}
    {query.created && <p className="notice">Content saved.</p>}{query.updated && <p className="notice">Content status updated.</p>}
    <section className="panel" style={{ margin: "22px 0" }}><h2 style={{ fontSize: 30 }}>Add content</h2>
      <form action={createContent} className="admin-form">
        <label>Title<input name="title" required maxLength={140}/></label>
        <label>Slug (optional)<input name="slug" maxLength={90} placeholder="Generated from title if blank"/></label>
        <label>Type<select name="type" defaultValue="video">{["video","podcast","article","resource","printable","pick","event","recipe","original"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <label>Category<input name="category" maxLength={80}/></label>
        <label>Tags (comma-separated)<input name="tags" placeholder="friendship, emunah, confidence"/></label>
        <label>Cover image URL (HTTPS)<input name="cover_url" type="url" placeholder="https://…"/></label>
        <label>Private R2 object key<input name="media_provider_id" maxLength={1024} placeholder="e.g. episodes/grief-interview.mp4"/><small>Use the exact object key in the private R2 bucket. Do not paste a public URL.</small></label>
        <label>Duration<input name="duration" placeholder="e.g. 24 min" maxLength={40}/></label>
        <label className="wide">Description<textarea name="description" rows={3} maxLength={5000}/></label>
        <label className="check-label"><input type="checkbox" name="member_only"/> Members only</label>
        <label className="check-label"><input type="checkbox" name="featured"/> Featured</label>
        <div className="wide"><button className="btn primary">Save content</button></div>
      </form>
    </section>
    <h2 style={{ fontSize: 30 }}>Existing content</h2>
    <div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Updated</th><th>Change status</th></tr></thead><tbody>{(data || []).map(x=><tr key={x.id}><td>{x.title}</td><td>{x.type}</td><td>{x.status}</td><td>{new Date(x.updated_at).toLocaleDateString()}</td><td><form action={setContentStatus} className="inline-form"><input type="hidden" name="id" value={x.id}/><select name="status" defaultValue={x.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><button className="btn secondary">Save</button></form></td></tr>)}</tbody></table></div>
  </>;
}
