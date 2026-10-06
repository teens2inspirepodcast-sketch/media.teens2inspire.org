"use client";

import { useState } from "react";
import type { Database } from "@/types/database";
import { LoaderCircle, Plus, Upload } from "lucide-react";

type ContentRow = Database["public"]["Tables"]["content"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Section = Database["public"]["Tables"]["sections"]["Row"];
type ContentType = Database["public"]["Enums"]["content_type"];
type Status = Database["public"]["Enums"]["content_status"];
const types: ContentType[] = ["podcast", "video", "article", "resource", "printable", "pick", "event", "recipe", "original"];

function toLocalInput(value: string | null) { return value ? new Date(value).toISOString().slice(0, 16) : ""; }
function makeSlug(value: string) { return value.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180); }

export function AdminStudio({ content, categories, sections, assignments }: { content: ContentRow[]; categories: Category[]; sections: Section[]; assignments: Record<string, string[]> }) {
  const [active, setActive] = useState<ContentRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState("");
  const [sectionBusy, setSectionBusy] = useState("");

  async function upload(file: File, field: "r2_thumbnail_key" | "r2_media_key") {
    setError(""); setNotice(""); setUploading(field);
    const typeInput = document.querySelector<HTMLSelectElement>('select[name="type"]');
    const type = typeInput?.value ?? active?.type;
    const purpose = field === "r2_thumbnail_key" ? "artwork" : type === "podcast" ? "podcast" : type === "video" ? "video" : "download";
    const reservation = await fetch("/api/media/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose, fileName: file.name, contentType: file.type, size: file.size }) }).catch(() => null);
    const signed = await reservation?.json().catch(() => null);
    if (!reservation?.ok || !signed?.uploadUrl || !signed?.key) {
      setError(signed?.error ?? "Cloud media storage could not prepare this upload.");
      setUploading("");
      return;
    }
    const uploaded = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file }).catch(() => null);
    if (!uploaded?.ok) setError("The file could not be uploaded. Check its type, size, and R2 bucket CORS settings.");
    else {
      const input = document.querySelector<HTMLInputElement>(`[name="${field}"]`);
      if (input) { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set; setter?.call(input, signed.key); input.dispatchEvent(new Event("input", { bubbles: true })); }
      const oldUrlField = document.querySelector<HTMLInputElement>(`[name="${field === "r2_thumbnail_key" ? "cover_url" : "media_url"}"]`);
      if (oldUrlField) { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set; setter?.call(oldUrlField, ""); oldUrlField.dispatchEvent(new Event("input", { bubbles: true })); }
      setNotice("Upload complete. Save the content to attach this Cloudflare R2 file.");
    }
    setUploading("");
  }

  async function saveContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const sectionIds = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="section_ids"]:checked')).map((input) => input.value);
    const nullable = (key: string) => String(values[key] ?? "").trim() || null;
    const data = {
      ...(active ? { id: active.id } : {}), title: String(values.title ?? "").trim(), slug: String(values.slug ?? "").trim(), type: String(values.type) as ContentType,
      status: String(values.status) as Status, short_description: nullable("short_description"), description: nullable("description"), body: nullable("body"),
      category: nullable("category"), tags: String(values.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean), creator_name: nullable("creator_name"),
      cover_url: nullable("cover_url"), media_url: nullable("media_url"), r2_media_key: nullable("r2_media_key"), r2_thumbnail_key: nullable("r2_thumbnail_key"), external_url: nullable("external_url"),
      duration_seconds: Number(values.duration_seconds) || null, reading_time_minutes: Number(values.reading_time_minutes) || null,
      member_only: values.member_only === "on", featured: values.featured === "on", category_id: nullable("category_id"), section_ids: sectionIds,
      event_starts_at: values.event_starts_at ? new Date(String(values.event_starts_at)).toISOString() : null,
      event_ends_at: values.event_ends_at ? new Date(String(values.event_ends_at)).toISOString() : null,
      event_location: nullable("event_location"), capacity: Number(values.capacity) || null, registration_url: nullable("registration_url"),
    };
    const response = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
    if (!response?.ok) { const payload = await response?.json().catch(() => null); setError(payload?.error ?? "Content could not be saved."); }
    else { setNotice("Content saved. Refresh this page to see the updated library."); setActive(null); form.reset(); }
    setBusy(false);
  }

  async function addSimple(event: React.FormEvent<HTMLFormElement>, endpoint: string, read: (data: FormData) => object) {
    event.preventDefault(); setBusy(true); setError(""); setNotice(""); const form = event.currentTarget;
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(read(new FormData(form))) }).catch(() => null);
    if (!response?.ok) { const payload = await response?.json().catch(() => null); setError(payload?.error ?? "This change could not be saved."); }
    else { form.reset(); setNotice("Saved. Refresh this page to see the update."); }
    setBusy(false);
  }

  async function saveSection(event: React.FormEvent<HTMLFormElement>, section: Section) {
    event.preventDefault(); setSectionBusy(section.id); setError(""); setNotice("");
    const values = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/sections", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: section.id, display_order: Number(values.get("display_order")), max_items: Number(values.get("max_items")), show_on_homepage: values.get("show_on_homepage") === "on", is_active: values.get("is_active") === "on" }) }).catch(() => null);
    if (!response?.ok) setError("That homepage section could not be updated."); else setNotice("Homepage section updated.");
    setSectionBusy("");
  }

  return <>
    <div className="admin-grid">
      <section className="admin-panel" aria-labelledby="content-form-title"><h2 id="content-form-title">{active ? "Edit a story" : "Create content"}</h2><p>Prepare an article, audio story, video, resource, printable, or event for the Teens2Inspire library.</p>
        <form className="admin-form" onSubmit={saveContent} key={active?.id ?? "new-content"}>
          <label>Title<input name="title" required minLength={2} maxLength={180} defaultValue={active?.title ?? ""} onChange={(event) => { const form = event.currentTarget.form; const slug = form?.elements.namedItem("slug") as HTMLInputElement | null; if (slug && (!active || slug.dataset.userEdited !== "true")) slug.value = makeSlug(event.currentTarget.value); }} /></label>
          <label>URL slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} defaultValue={active?.slug ?? ""} onChange={(event) => { event.currentTarget.dataset.userEdited = "true"; }} /></label>
          <div className="form-row"><label>Content type<select name="type" defaultValue={active?.type ?? "article"}>{types.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></label><label>Publishing status<select name="status" defaultValue={active?.status ?? "draft"}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div>
          <div className="form-row"><label>Category<select name="category_id" defaultValue={active?.category_id ?? ""}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Category label<input name="category" maxLength={80} defaultValue={active?.category ?? ""} /></label></div>
          <label>Short description<input name="short_description" maxLength={300} defaultValue={active?.short_description ?? ""} /></label>
          <label>Description<textarea name="description" maxLength={4000} rows={3} defaultValue={active?.description ?? ""} /></label>
          <label>Article body / resource details<textarea name="body" maxLength={40000} rows={7} defaultValue={active?.body ?? ""} /></label>
          <label>Creator / author<input name="creator_name" maxLength={120} defaultValue={active?.creator_name ?? ""} /></label>
          <label>Topics, separated by commas<input name="tags" maxLength={480} defaultValue={active?.tags?.join(", ") ?? ""} /></label>
          <div className="form-row"><label>Duration in seconds<input type="number" name="duration_seconds" min={0} max={86400} defaultValue={active?.duration_seconds ?? ""} /></label><label>Reading time in minutes<input type="number" name="reading_time_minutes" min={0} max={600} defaultValue={active?.reading_time_minutes ?? ""} /></label></div>
          <label>Legacy artwork URL<input name="cover_url" type="url" maxLength={1200} defaultValue={active?.cover_url ?? ""} /><input type="hidden" name="r2_thumbnail_key" defaultValue={active?.r2_thumbnail_key ?? ""} /><span className="upload-control"><input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload artwork to Cloudflare R2" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0], "r2_thumbnail_key")} /><span><Upload size={13} /> {uploading === "r2_thumbnail_key" ? "Uploading artwork…" : "Upload artwork to R2"}</span></span></label>
          <label>Legacy external media URL<input name="media_url" type="text" maxLength={1200} defaultValue={active?.media_url ?? ""} placeholder="https://… (external media only)" /><input type="hidden" name="r2_media_key" defaultValue={active?.r2_media_key ?? ""} /><span className="upload-control"><input type="file" accept="audio/*,video/mp4,video/webm,video/quicktime,application/pdf,image/jpeg,image/png" aria-label="Upload media or download to Cloudflare R2" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0], "r2_media_key")} /><span><Upload size={13} /> {uploading === "r2_media_key" ? "Uploading file…" : "Upload media to R2"}</span></span></label>
          <label>External link<input name="external_url" type="url" maxLength={1200} defaultValue={active?.external_url ?? ""} /></label>
          <div className="form-row"><label>Event starts<input name="event_starts_at" type="datetime-local" defaultValue={toLocalInput(active?.event_starts_at ?? null)} /></label><label>Event ends<input name="event_ends_at" type="datetime-local" defaultValue={toLocalInput(active?.event_ends_at ?? null)} /></label></div>
          <div className="form-row"><label>Event location<input name="event_location" maxLength={240} defaultValue={active?.event_location ?? ""} /></label><label>Capacity<input name="capacity" type="number" min={1} max={100000} defaultValue={active?.capacity ?? ""} /></label></div>
          <label>Registration link<input name="registration_url" type="url" maxLength={1200} defaultValue={active?.registration_url ?? ""} /></label>
          {sections.length > 0 && <fieldset className="admin-assignment-fieldset"><legend>Homepage shelves</legend><div className="admin-assignment-options">{sections.map((section) => <label className="checkbox-row" key={section.id}><input name="section_ids" type="checkbox" value={section.id} defaultChecked={Boolean(active && assignments[active.id]?.includes(section.id))} />{section.name}</label>)}</div></fieldset>}
          <label className="checkbox-row"><input name="featured" type="checkbox" defaultChecked={active?.featured ?? false} /> Feature this content</label><label className="checkbox-row"><input name="member_only" type="checkbox" defaultChecked={active?.member_only ?? false} /> Members only</label>
          {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
          <div className="hero-actions"><button className="button button-primary" disabled={busy || Boolean(uploading)}>{busy ? <LoaderCircle size={15} className="spin" /> : "Save content"}</button>{active && <button className="text-link" type="button" onClick={() => setActive(null)}>Cancel edit</button>}</div>
        </form>
      </section>
      <section className="admin-panel"><h2>Library</h2><p>{content.length} most recently updated items.</p><div className="admin-content-list">{content.map((item) => <div className="admin-content-row" key={item.id}><div><strong>{item.title}</strong><small>{item.type} · /{item.slug}</small></div><div className="admin-row-actions"><span className={`admin-badge admin-badge-${item.status}`}>{item.status}</span><button type="button" className="admin-form-link" onClick={() => { setActive(item); setError(""); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button></div></div>)}</div></section>
    </div>
    <section className="admin-section"><div className="admin-section-list">
      <div className="admin-panel"><h2>Categories</h2><div className="admin-content-list">{categories.map((category) => <div className="admin-content-row" key={category.id}><div><strong>{category.name}</strong><small>{category.slug}</small></div></div>)}</div><form className="admin-form compact-admin-form" onSubmit={(event) => addSimple(event, "/api/admin/categories", (form) => ({ name: form.get("name"), slug: form.get("slug"), description: String(form.get("description") ?? "").trim() || null, content_type: String(form.get("content_type") ?? "") || null }))}><h3>Add a category</h3><label>Name<input name="name" required minLength={2} maxLength={80} /></label><label>Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={80} /></label><label>For content type<select name="content_type"><option value="">All types</option>{types.map((type) => <option key={type}>{type}</option>)}</select></label><label>Description<input name="description" maxLength={240} /></label><button className="button button-secondary" disabled={busy}><Plus size={14} />Add category</button></form></div>
      <div className="admin-panel"><h2>Homepage shelves</h2><div className="admin-content-list">{sections.map((section) => <form className="admin-section-row admin-section-edit" key={section.id} onSubmit={(event) => saveSection(event, section)}><strong>{section.name}</strong><div className="form-row"><label>Order<input name="display_order" type="number" min={0} max={1000} defaultValue={section.display_order} /></label><label>Items<input name="max_items" type="number" min={1} max={24} defaultValue={section.max_items} /></label></div><label className="checkbox-row"><input name="show_on_homepage" type="checkbox" defaultChecked={section.show_on_homepage} /> Show on the member homepage</label><label className="checkbox-row"><input name="is_active" type="checkbox" defaultChecked={section.is_active} /> Active</label><button className="button button-secondary" disabled={Boolean(sectionBusy)}>{sectionBusy === section.id ? <LoaderCircle size={14} className="spin" /> : "Save shelf"}</button></form>)}</div><p>Set the order and visibility of homepage shelves. Assign content to shelves in the story editor.</p><form className="admin-form compact-admin-form" onSubmit={(event) => addSimple(event, "/api/admin/sections", (form) => ({ name: form.get("name"), slug: form.get("slug"), description: String(form.get("description") ?? "").trim() || null, display_order: Number(form.get("display_order") ?? 0), max_items: Number(form.get("max_items") ?? 10), show_on_homepage: form.get("show_on_homepage") === "on" }))}><h3>Add a homepage shelf</h3><label>Name<input name="name" required minLength={2} maxLength={100} /></label><label>Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} /></label><label>Description<input name="description" maxLength={240} /></label><div className="form-row"><label>Order<input name="display_order" type="number" min={0} max={1000} defaultValue={0} /></label><label>Items to show<input name="max_items" type="number" min={1} max={24} defaultValue={10} /></label></div><label className="checkbox-row"><input name="show_on_homepage" type="checkbox" defaultChecked /> Show on the member homepage</label><button className="button button-secondary" disabled={busy}><Plus size={14} />Add shelf</button></form></div>
    </div></section>
  </>;
}
