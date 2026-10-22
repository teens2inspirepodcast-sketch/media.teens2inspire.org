import { requireAdmin } from "@/lib/auth";
import { createContent, updateContent, deleteContent } from "./actions";
import { R2MediaUpload } from "@/components/r2-media-upload";

export default async function ContentAdmin({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const [{ data }, { data: sections }] = await Promise.all([supabase.from("content").select("id,title,type,status,updated_at,slug,description,category,tags,cover_url,external_url,r2_media_key,duration_seconds,member_only,featured").order("updated_at", { ascending: false }).limit(100), supabase.from("sections").select("id,name,is_active").order("display_order")]);
  const errorText: Record<string, string> = { invalid: "Check the required fields and use HTTPS for cover images.", "duplicate-slug": "That slug is already in use. Choose a unique slug.", "save-failed": "The change could not be saved.", "section-link-failed": "Content was not saved because its section could not be linked. Check the sections schema and try again.", "delete-failed": "Content could not be deleted. Check related records and try again." };
  return <>
    <h1 style={{ fontSize: 42 }}>Content Studio</h1>
    <p>Create content records and publish/unpublish items. Upload audio/video directly to your private Cloudflare R2 bucket here, or enter an existing private object key.</p>
    {query.error && <p className="notice" role="alert">{errorText[query.error] || "Something went wrong."}</p>}
    {query.created && <p className="notice">Content saved.</p>}{query.updated && <p className="notice">Content updated.</p>}{query.deleted && <p className="notice">Content deleted.</p>}
    <section className="panel" style={{ margin: "22px 0" }}><h2 style={{ fontSize: 30 }}>Add content</h2><p>Save content metadata in Supabase. Upload media to Cloudflare R2 or use an individual external podcast player URL. Assigning a section links the content to that reusable carousel.</p>
      <form action={createContent} className="admin-form">
        <label>Title<input name="title" required maxLength={140}/></label>
        <label>Slug (optional)<input name="slug" maxLength={90} placeholder="Generated from title if blank"/></label>
        <label>Type<select name="type" defaultValue="video">{["video","podcast","article","resource","printable","pick","event","recipe","original"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <label>Category<input name="category" maxLength={80}/></label>
        <label>Carousel / Section<select name="section_id" defaultValue=""><option value="">No section</option>{(sections || []).map(section=><option key={section.id} value={section.id}>{section.name}{section.is_active ? "" : " (draft)"}</option>)}</select><small>Choose the carousel this content should appear in. Manage reusable sections under Sections &amp; Collections.</small></label>
        <label>Tags (comma-separated)<input name="tags" placeholder="friendship, emunah, confidence"/></label>
        <label>Cover image URL (HTTPS)<input name="cover_url" type="url" placeholder="https://…"/></label>
        <label className="wide">External player URL (RSS.com episode embed or other HTTPS media)<input name="external_url" type="url" placeholder="https://player.rss.com/teens2inspire/…"/><small>For podcasts, paste the individual episode player URL. This lets each episode play inside Teens2Inspire.</small></label>
        <R2MediaUpload />
        <label>Duration (seconds)<input name="duration_seconds" placeholder="e.g. 1440" type="number" min={0} max={86400}/></label>
        <label className="wide">Description<textarea name="description" rows={3} maxLength={5000}/></label>
        <label className="check-label"><input type="checkbox" name="member_only"/> Members only</label>
        <label className="check-label"><input type="checkbox" name="featured"/> Featured</label>
        <div className="wide"><button className="btn primary">Save content</button></div>
      </form>
    </section>
    <h2 style={{ fontSize: 30 }}>Edit or delete content</h2>
    <div style={{ display: "grid", gap: 18 }}>{(data || []).map(x=><details key={x.id} className="panel"><summary style={{ cursor: "pointer", fontWeight: 700 }}>{x.title} · {x.type} · {x.status}</summary>
      <form action={updateContent} className="admin-form" style={{ marginTop: 16 }}><input type="hidden" name="id" value={x.id}/>
        <label>Title<input name="title" defaultValue={x.title} required maxLength={140}/></label><label>Slug<input name="slug" defaultValue={x.slug || ""} maxLength={90} required/></label>
        <label>Type<select name="type" defaultValue={x.type}>{["video","podcast","article","resource","printable","pick","event","recipe","original"].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        <label>Status<select name="status" defaultValue={x.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <label>Category<input name="category" defaultValue={x.category || ""} maxLength={80}/></label><label>Tags (comma-separated)<input name="tags" defaultValue={(x.tags || []).join(", ")}/></label>
        <label>Cover image URL<input name="cover_url" type="url" defaultValue={x.cover_url || ""}/></label><label>External player URL<input name="external_url" type="url" defaultValue={x.external_url || ""}/></label>
        <label>R2 object key<input name="r2_media_key" defaultValue={x.r2_media_key || ""}/></label><label>Duration (seconds)<input name="duration_seconds" type="number" min={0} max={86400} defaultValue={x.duration_seconds ?? ""}/></label>
        <label className="wide">Description<textarea name="description" rows={3} defaultValue={x.description || ""}/></label>
        <label className="check-label"><input type="checkbox" name="member_only" defaultChecked={!!x.member_only}/> Members only</label><label className="check-label"><input type="checkbox" name="featured" defaultChecked={!!x.featured}/> Featured</label>
        <div className="wide" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn primary">Save edits</button></div>
      </form><form action={deleteContent} style={{ marginTop: 12 }}><input type="hidden" name="id" value={x.id}/><button className="btn secondary" formAction={deleteContent}>Delete content</button></form>
    </details>)}</div>
  </>;
}
