import { requireAdmin } from "@/lib/auth";
import { createContent, setContentStatus, deleteContent } from "./actions";
import { R2MediaUpload } from "@/components/r2-media-upload";

export default async function ContentAdmin({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const [{ data }, { data: sections }] = await Promise.all([supabase.from("content").select("id,title,type,status,updated_at,slug").order("updated_at", { ascending: false }).limit(100), supabase.from("sections").select("id,name,is_active").order("display_order")]);
  const errorText: Record<string, string> = { invalid: "Check the required fields and use HTTPS for cover images.", "duplicate-slug": "That slug is already in use. Choose a unique slug.", "save-failed": "The change could not be saved.", "section-link-failed": "Content was not saved because its section could not be linked. Check the sections schema and try again." };
  return <>
    <h1 style={{ fontSize: 42 }}>Content Studio</h1>
    <p>Create content records and publish/unpublish items. Upload audio/video directly to your private Cloudflare R2 bucket here, or enter an existing private object key.</p>
    {query.error && <p className="notice" role="alert">{errorText[query.error] || "Something went wrong."}</p>}
    {query.created && <p className="notice">Content saved.</p>}{query.updated && <p className="notice">Content status updated.</p>}{query.deleted && <p className="notice">Content deleted.</p>}{query.error === "delete-failed" && <p className="notice" role="alert">Could not delete this content. It may be linked to another record.</p>}
    <section className="panel" style={{ margin: "22px 0" }}><h2 style={{ fontSize: 30 }}>Add content</h2><p>Save content metadata in Supabase. Upload media to Cloudflare R2 or use an individual external podcast player URL. Assigning a section links the content to that reusable carousel.</p>
      <form action={createContent} className="admin-form">
        <label>Title<input name="title" required maxLength={140}/></label>
        <label>Slug (optional)<input name="slug" maxLength={90} placeholder="Generated from title if blank"/></label>
        <label>Type<select name="type" defaultValue="video">{["video","podcast","article","resource","printable","pick","event","recipe","original"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <label>Category<input name="category" maxLength={80}/></label>
        <label>Carousel / Section<select name="section_id" defaultValue=""><option value="">No section</option>{(sections || []).map(section=><option key={section.id} value={section.id}>{section.name}{section.is_active ? "" : " (draft)"}</option>)}</select><small>Choose the carousel this content should appear in. Manage reusable sections under Sections &amp; Collections.</small></label>
        <label>Tags (comma-separated)<input name="tags" placeholder="friendship, emunah, confidence"/></label>
        <div className="wide"><R2MediaUpload fieldName="cover_url" artwork/></div>
        <label className="wide">External player URL (RSS.com episode embed or other HTTPS media)<input name="external_url" type="url" placeholder="https://player.rss.com/teens2inspire/…"/><small>For podcasts, paste the individual episode player URL. This lets each episode play inside Teens2Inspire.</small></label>
        <R2MediaUpload />
        <label>Duration (seconds)<input name="duration_seconds" placeholder="e.g. 1440" type="number" min={0} max={86400}/></label>
        <label className="wide">Description<textarea name="description" rows={3} maxLength={5000}/></label>
        <label className="check-label"><input type="checkbox" name="member_only"/> Members only</label>
        <label className="check-label"><input type="checkbox" name="featured"/> Featured</label>
        <div className="wide"><button className="btn primary">Save content</button></div>
      </form>
    </section>
    <h2 style={{ fontSize: 30 }}>Existing content</h2>
    <div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Updated</th><th>Change status</th><th>Delete</th></tr></thead><tbody>{(data || []).map(x=><tr key={x.id}><td>{x.title}</td><td>{x.type}</td><td>{x.status}</td><td>{new Date(x.updated_at).toLocaleDateString()}</td><td><form action={setContentStatus} className="inline-form"><input type="hidden" name="id" value={x.id}/><select name="status" defaultValue={x.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><button className="btn secondary">Save</button></form></td><td><form action={deleteContent}><input type="hidden" name="id" value={x.id}/><button className="btn secondary" formAction={deleteContent}>Delete</button></form></td></tr>)}</tbody></table></div>
  </>;
}
