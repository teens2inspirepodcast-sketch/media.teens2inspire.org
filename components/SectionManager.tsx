"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ContentRecord } from "@/lib/content";

type Section = { id: string; name: string; slug: string; description: string | null; section_type: string; display_order: number; is_active: boolean; show_on_homepage: boolean; show_in_navigation: boolean; card_style: string; max_items: number; see_all_label: string };

function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function SectionManager({ initialSections, items, initialAssignments }: { initialSections: Section[]; items: ContentRecord[]; initialAssignments: Record<string, string[]> }) {
  const [sections, setSections] = useState(initialSections); const [assignments, setAssignments] = useState(initialAssignments); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const [newName, setNewName] = useState(""); const router = useRouter();
  async function send(body: Record<string, unknown>) {
    const response = await fetch("/api/sections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Section update failed."); return data;
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(""); const form = event.currentTarget; const values = new FormData(form); const name = String(values.get("name") || "");
    try { await send({ name, slug: String(values.get("slug") || slugify(name)), description: values.get("description"), section_type: values.get("section_type"), max_items: Number(values.get("max_items") || 6), show_on_homepage: values.get("show_on_homepage") === "on", is_active: true, display_order: sections.length, content_ids: [] }); setNewName(""); setNotice("Section created."); form.reset(); router.refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Section creation failed."); } finally { setBusy(false); }
  }
  async function update(event: FormEvent<HTMLFormElement>, section: Section) {
    event.preventDefault(); setBusy(true); setNotice(""); const values = new FormData(event.currentTarget); const ids = assignments[section.id] || [];
    try { await send({ id: section.id, name: values.get("name"), slug: values.get("slug"), description: values.get("description"), section_type: values.get("section_type"), display_order: Number(values.get("display_order") || 0), max_items: Number(values.get("max_items") || 6), is_active: values.get("is_active") === "on", show_on_homepage: values.get("show_on_homepage") === "on", show_in_navigation: values.get("show_in_navigation") === "on", card_style: values.get("card_style"), see_all_label: values.get("see_all_label"), content_ids: ids }); setNotice(`“${section.name}” saved.`); router.refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Section update failed."); } finally { setBusy(false); }
  }
  async function reorder(sectionId: string, direction: -1 | 1) {
    const next = [...sections]; const index = next.findIndex((section) => section.id === sectionId); const target = index + direction; if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]; setSections(next);
    try { await send({ action: "reorder", ids: next.map((section) => section.id) }); setNotice("Section order saved."); router.refresh(); }
    catch (error) { setSections(sections); setNotice(error instanceof Error ? error.message : "Section order could not be saved."); }
  }
  async function archive(section: Section) {
    if (!window.confirm(`Hide “${section.name}” from the public site? Its content assignments will be kept.`)) return;
    setBusy(true); try { await send({ action: "archive", id: section.id }); setSections(sections.map((item) => item.id === section.id ? { ...item, is_active: false } : item)); setNotice("Section archived. Content was kept."); router.refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Section could not be archived."); } finally { setBusy(false); }
  }
  function toggleItem(sectionId: string, contentId: string) {
    setAssignments((current) => { const existing = current[sectionId] || []; return { ...current, [sectionId]: existing.includes(contentId) ? existing.filter((id) => id !== contentId) : [...existing, contentId] }; });
  }
  function moveItem(sectionId: string, contentId: string, delta: -1 | 1) {
    setAssignments((current) => { const list = [...(current[sectionId] || [])]; const index = list.indexOf(contentId); const target = index + delta; if (index < 0 || target < 0 || target >= list.length) return current; [list[index], list[target]] = [list[target], list[index]]; return { ...current, [sectionId]: list }; });
  }
  return <section className="studio-editor section-manager" aria-labelledby="section-manager-title">
    <span className="eyebrow">Homepage organization</span><h2 id="section-manager-title">Content sections</h2><p>Create public collections and choose the published content and order inside each one.</p>
    {notice && <p className="form-success" role="status">{notice}</p>}
    <form className="studio-form section-create-form" onSubmit={create}><h3>Create a section</h3><div className="form-grid"><label>Name<input name="name" value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={100} required /></label><label>Section address<input name="slug" defaultValue="" placeholder={slugify(newName) || "section-address"} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><label>Type<select name="section_type"><option value="collection">Collection</option><option value="editorial">Editorial</option><option value="seasonal">Seasonal</option><option value="featured">Featured</option></select></label><label>Homepage item limit<input name="max_items" type="number" min="1" max="24" defaultValue="6" /></label><label className="form-wide">Description<textarea name="description" rows={2} maxLength={2000} /></label><label className="section-check"><input type="checkbox" name="show_on_homepage" defaultChecked /> Show on homepage</label></div><button className="button button-primary" disabled={busy}>Create section <span aria-hidden="true">↗</span></button></form>
    {sections.length ? <div className="section-admin-list">{sections.map((section, index) => {
      const selected = assignments[section.id] || [];
      return <details className="section-admin-item" key={section.id}><summary><span className={section.is_active ? "status-dot status-published" : "status-dot status-archived"} /><b>{section.name}</b><small>{section.slug} · {selected.length} assigned · {section.is_active ? "Active" : "Archived"}</small><span className="section-summary-controls"><button type="button" aria-label={`Move ${section.name} up`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void reorder(section.id, -1); }} disabled={index === 0}>↑</button><button type="button" aria-label={`Move ${section.name} down`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void reorder(section.id, 1); }} disabled={index === sections.length - 1}>↓</button></span></summary>
        <form className="studio-form section-edit-form" onSubmit={(event) => update(event, section)}><div className="form-grid"><label>Name<input name="name" defaultValue={section.name} required maxLength={100} /></label><label>Section address<input name="slug" defaultValue={section.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><label>Type<select name="section_type" defaultValue={section.section_type}><option value="collection">Collection</option><option value="editorial">Editorial</option><option value="seasonal">Seasonal</option><option value="featured">Featured</option></select></label><label>Homepage item limit<input name="max_items" type="number" min="1" max="24" defaultValue={section.max_items} /></label><label>See all label<input name="see_all_label" defaultValue={section.see_all_label} maxLength={32} /></label><label>Card style<select name="card_style" defaultValue={section.card_style}><option value="poster">Poster</option><option value="landscape">Landscape</option><option value="compact">Compact</option></select></label><label className="form-wide">Description<textarea name="description" rows={2} defaultValue={section.description || ""} maxLength={2000} /></label><label className="section-check"><input type="checkbox" name="is_active" defaultChecked={section.is_active} /> Active / public</label><label className="section-check"><input type="checkbox" name="show_on_homepage" defaultChecked={section.show_on_homepage} /> Show on homepage</label><label className="section-check"><input type="checkbox" name="show_in_navigation" defaultChecked={section.show_in_navigation} /> Show in navigation</label></div>
          <fieldset className="section-content-picker"><legend>Content order</legend><p>Select items, then use the arrow buttons to set their position. Only published items appear publicly.</p><div className="section-assigned-list">{selected.map((id, order) => { const item = items.find((candidate) => candidate.id === id); if (!item) return null; return <div className="section-assigned-row" key={id}><label><input type="checkbox" checked onChange={() => toggleItem(section.id, id)} /> {item.title} <small>{item.type} · {item.status}</small></label><button type="button" onClick={() => moveItem(section.id, id, -1)} disabled={order === 0} aria-label={`Move ${item.title} up`}>↑</button><button type="button" onClick={() => moveItem(section.id, id, 1)} disabled={order === selected.length - 1} aria-label={`Move ${item.title} down`}>↓</button></div>; })}</div><details className="section-available-content"><summary>Add or remove content</summary><div>{items.map((item) => <label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleItem(section.id, item.id)} /> {item.title} <small>{item.type} · {item.status}</small></label>)}</div></details></fieldset>
          <div className="studio-form-actions"><button className="button button-primary" disabled={busy}>Save section</button><a className="text-link" href={`/sections/${section.slug}`} target="_blank" rel="noreferrer">Preview public page ↗</a><button type="button" className="studio-remove" onClick={() => void archive(section)} disabled={busy || !section.is_active}>Archive section</button></div>
        </form>
      </details>;
    })}</div> : <p className="muted-copy">No sections yet. Create one above to arrange the homepage.</p>}
  </section>;
}
