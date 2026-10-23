import { requireAdmin } from "@/lib/auth";
import { createPartnership, togglePartnership, deletePartnership } from "./actions";
export default async function PartnershipsAdmin({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data, error } = await supabase.from("partnerships").select("id,name,logo_url,website_url,description,display_order,is_active").order("display_order").order("name");
  const errors: Record<string,string> = { invalid: "Enter a name, an HTTPS link, a logo URL, and a non-negative order.", duplicate: "This partner already exists.", "save-failed": "The change could not be saved. Check your connection and try again." };
  return <div className="studio-editor-page">
    <div className="studio-welcome"><div><span className="studio-eyebrow">PUBLIC WEBSITE CMS</span><h1>Partnerships</h1><p>These active wordmarks loop across the homepage of teens2inspire.org. Updates are read from Supabase by both sites.</p></div></div>
    {params.error && <p className="notice" role="alert">{errors[params.error] || "Something went wrong."}</p>}{params.saved && <p className="notice">Changes saved. The public homepage uses the latest active partners.</p>}{params.deleted && <p className="notice">Partner removed.</p>}{error && <p className="notice" role="alert">Partners could not be loaded.</p>}
    <section className="studio-form-section"><div className="studio-form-section-title"><span>＋</span><div><h2>Add a partner</h2><p>Use an included logo path (for example <code>/partners/mosaica-press.svg</code>) or an HTTPS logo URL. Keep the link pointed at the partner's website.</p></div></div>
      <form action={createPartnership} className="studio-form-grid">
        <label>Partner name *<input name="name" required maxLength={100} placeholder="Organization name" /></label>
        <label>Logo URL / public asset path *<input name="logo_url" required maxLength={1000} placeholder="/partners/your-logo.svg" /></label>
        <label>Website URL *<input name="website_url" required type="url" placeholder="https://example.org" /></label>
        <label>Display order<input name="display_order" type="number" min={0} max={10000} defaultValue={10} /></label>
        <label className="studio-field-wide">Short description (optional)<input name="description" maxLength={500} placeholder="A community partner of Teens2Inspire" /></label>
        <div className="studio-field-wide" style={{display:"flex",justifyContent:"flex-end"}}><button className="studio-primary-button" type="submit">Add partner</button></div>
      </form>
    </section>
    <section className="studio-form-section" style={{marginTop:18}}><div className="studio-form-section-title"><span>02</span><div><h2>Homepage carousel</h2><p>Deactivate a partner to temporarily hide it without deleting the record.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Logo</th><th>Name</th><th>Destination</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead><tbody>{(data || []).map(p => <tr key={p.id}><td><img src={p.logo_url} alt="" style={{width:115,height:42,objectFit:"contain",background:"#fff",borderRadius:7}}/></td><td><strong>{p.name}</strong>{p.description && <div className="small-note">{p.description}</div>}</td><td><a href={p.website_url} target="_blank" rel="noreferrer">Open site ↗</a></td><td>{p.display_order}</td><td>{p.is_active ? "Active" : "Hidden"}</td><td><div className="actions"><form action={togglePartnership}><input type="hidden" name="id" value={p.id}/><input type="hidden" name="is_active" value={String(!p.is_active)}/><button className="btn secondary" type="submit">{p.is_active ? "Hide" : "Show"}</button></form><form action={deletePartnership}><input type="hidden" name="id" value={p.id}/><button className="btn secondary" type="submit">Delete</button></form></div></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
