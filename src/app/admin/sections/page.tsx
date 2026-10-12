import { requireAdmin } from "@/lib/auth";
import { assignContent, createSection, removeSectionContent, toggleSection } from "./actions";
export default async function Sections({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; updated?: string }> }) {
  const { supabase } = await requireAdmin(); const query = await searchParams;
  const [{ data: sections }, { data: content }] = await Promise.all([
    supabase.from("sections").select("id,title,slug,description,is_published,sort_order").order("sort_order"),
    supabase.from("content").select("id,title,status,type").order("title").limit(300),
  ]);
  const errorMessage: Record<string,string> = { duplicate: "That slug is already in use.", invalid: "Check the fields and try again.", "save-failed": "The change could not be saved.", "assign-failed": "The content could not be assigned to the collection." };
  const sectionItems = await Promise.all((sections || []).map(async section => {
    const { data } = await supabase.from("section_content").select("content_id,sort_order,content(id,title,type)").eq("section_id", section.id).order("sort_order");
    return { section, items: data || [] };
  }));
  return <>
    <h1 style={{ fontSize: 42 }}>Sections & Collections</h1><p>Manage curated shelves and assign content to each collection.</p>
    {query.error && <p className="notice" role="alert">{errorMessage[query.error] || "Something went wrong."}</p>}
    {(query.created || query.updated) && <p className="notice">Collection changes saved.</p>}
    <section className="panel" style={{ margin: "22px 0" }}><h2 style={{ fontSize: 30 }}>Add collection</h2><form action={createSection} className="admin-form">
      <label>Title<input name="title" required maxLength={120}/></label><label>Slug (optional)<input name="slug" maxLength={90}/></label><label>Sort order<input name="sort_order" type="number" min={0} defaultValue={0}/></label><label className="check-label"><input type="checkbox" name="is_published"/> Publish immediately</label><label className="wide">Description<textarea name="description" rows={3} maxLength={2000}/></label><div className="wide"><button className="btn primary">Save collection</button></div>
    </form></section>
    <div className="grid">{sectionItems.map(({ section, items })=><article className="card" key={section.id}>
      <div className="eyebrow">{section.is_published ? "PUBLISHED" : "DRAFT"} · ORDER {section.sort_order}</div><h3>{section.title}</h3><p>{section.description}</p>
      <form action={toggleSection}><input type="hidden" name="id" value={section.id}/><input type="hidden" name="is_published" value={String(!section.is_published)}/><button className="btn secondary">{section.is_published ? "Unpublish" : "Publish"}</button></form>
      <h4>Assigned content</h4>{items.length ? items.map((row: any)=><div className="assigned-item" key={row.content_id}><span>{row.content?.title || "Unavailable content"}</span><form action={removeSectionContent}><input type="hidden" name="section_id" value={section.id}/><input type="hidden" name="content_id" value={row.content_id}/><button className="text-button">Remove</button></form></div>) : <p>No content assigned yet.</p>}
      <form action={assignContent} className="assign-form"><input type="hidden" name="section_id" value={section.id}/><label>Add content<select name="content_id" required defaultValue=""> <option value="" disabled>Choose an item</option>{(content || []).filter(item=>!items.some((row: any)=>row.content_id===item.id)).map(item=><option key={item.id} value={item.id}>{item.title} ({item.status})</option>)}</select></label><button className="btn primary">Assign</button></form>
    </article>)}</div>
  </>;
}
