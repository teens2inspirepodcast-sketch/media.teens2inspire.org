"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Tab = "Content" | "Events" | "Categories" | "Home shelves" | "School codes" | "Discounts" | "Mailing list" | "Members";
type ContentRow = { id: string; title: string; type: string; status: string; created_at: string; featured: boolean; member_only: boolean; slug?: string; event_starts_at?: string | null; event_location?: string | null };
type CategoryRow = { id: string; name: string; slug: string; description: string | null; is_active: boolean; display_order: number };
type SectionRow = { id: string; name: string; slug: string; is_active: boolean; show_on_homepage: boolean; display_order: number; max_items: number };
type AssignmentRow = { section_id: string; content_id: string; display_order: number };
type CodeRow = { id: string; school_name: string; active: boolean; max_uses: number; uses: number; expires_at: string | null; created_at: string };
type MailingRow = { id: string; email: string; first_name: string | null; display_name: string | null; subscribed: boolean; status: string | null; created_at: string };
type MemberRow = { id: string; display_name: string | null; first_name: string | null; membership_tier: string; membership_status: string | null; role: string; created_at: string; membership_period_end: string | null };
type PromotionRow = { id: string; code: string; active: boolean; max_redemptions: number | null; times_redeemed: number; expires_at: number | null; name: string; percent_off: number | null; amount_off: number | null; currency: string | null };

const tabs: Tab[] = ["Content", "Events", "Categories", "Home shelves", "School codes", "Discounts", "Mailing list", "Members"];
const contentTypes = ["podcast", "video", "article", "resource", "printable", "event", "recipe", "pick", "original"];

function friendlyError(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message || "");
    if (/permission|row-level security|not allowed|denied/i.test(message)) return "Your administrator account does not have access to this area yet. Check the table's Supabase administrator policy.";
  }
  return fallback;
}

function makeSchoolCode() {
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `T2I-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

export default function AdminClient({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("Content");
  const [items, setItems] = useState<ContentRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [assignmentSelection, setAssignmentSelection] = useState<Record<string, string>>({});
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [mailing, setMailing] = useState<MailingRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [promotionForm, setPromotionForm] = useState({ name: "", code: "", percent_off: "15", max_redemptions: "" });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", type: "podcast", description: "", category: "", member_only: false, featured: false });
  const [eventForm, setEventForm] = useState({ starts_at: "", ends_at: "", location: "", capacity: "", registration_url: "" });
  const [media, setMedia] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [codeForm, setCodeForm] = useState({ school_name: "", max_uses: "", expires_at: "" });
  const [codeValue, setCodeValue] = useState("");

  const db = useMemo(() => createBrowserSupabase(), []);

  async function loadContent() {
    const { data, error } = await db.from("content").select("id,title,type,status,created_at,featured,member_only,slug,event_starts_at,event_location").order("created_at", { ascending: false }).limit(120);
    if (error) throw error;
    setItems((data || []) as ContentRow[]);
  }
  async function loadCategories() {
    const { data, error } = await db.from("categories").select("id,name,slug,description,is_active,display_order").order("display_order").order("name");
    if (error) throw error;
    setCategories((data || []) as CategoryRow[]);
  }
  async function loadSections() {
    const { data, error } = await db.from("sections").select("id,name,slug,is_active,show_on_homepage,display_order,max_items").order("display_order");
    if (error) throw error;
    setSections((data || []) as SectionRow[]);
  }
  async function loadAssignments() {
    const { data, error } = await db.from("section_content").select("section_id,content_id,display_order").order("display_order");
    if (error) throw error;
    setAssignments((data || []) as AssignmentRow[]);
  }
  async function assignContent(sectionId: string) {
    const contentId = assignmentSelection[sectionId];
    if (!contentId) { setNotice("Choose a content item first."); return; }
    if (assignments.some((assignment) => assignment.section_id === sectionId && assignment.content_id === contentId)) { setNotice("That item is already in this shelf."); return; }
    setRowBusy(sectionId); setNotice("");
    try {
      const nextOrder = Math.max(-1, ...assignments.filter((assignment) => assignment.section_id === sectionId).map((assignment) => assignment.display_order)) + 1;
      const { error } = await db.from("section_content").insert({ section_id: sectionId, content_id: contentId, display_order: nextOrder });
      if (error) throw error;
      await loadAssignments(); setNotice("Content added to the shelf.");
    } catch (error) { setNotice(friendlyError(error, "The content could not be added to this shelf.")); }
    finally { setRowBusy(null); }
  }
  async function removeAssignment(sectionId: string, contentId: string) {
    setRowBusy(`${sectionId}:${contentId}`); setNotice("");
    try { const { error } = await db.from("section_content").delete().eq("section_id", sectionId).eq("content_id", contentId); if (error) throw error; await loadAssignments(); setNotice("Content removed from the shelf."); }
    catch (error) { setNotice(friendlyError(error, "The content could not be removed from this shelf.")); }
    finally { setRowBusy(null); }
  }
  async function loadCodes() {
    const { data, error } = await db.from("school_codes").select("id,school_name,active,max_uses,uses,expires_at,created_at").order("created_at", { ascending: false }).limit(150);
    if (error) throw error;
    setCodes((data || []) as CodeRow[]);
  }
  async function loadMailingList() {
    const { data, error } = await db.from("mailing_list").select("id,email,first_name,display_name,subscribed,status,created_at").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    setMailing((data || []) as MailingRow[]);
  }
  async function loadMembers() {
    const { data, error } = await db.from("profiles").select("id,display_name,first_name,membership_tier,membership_status,role,created_at,membership_period_end").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    setMembers((data || []) as MemberRow[]);
  }
  async function loadPromotions() {
    const response = await fetch("/api/admin/promotions", { cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(result?.promotions)) throw new Error(typeof result?.error === "string" ? result.error : "Discount codes could not be loaded.");
    setPromotions(result.promotions as PromotionRow[]);
  }
  async function createPromotion(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/admin/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name: promotionForm.name, code: promotionForm.code, percent_off: Number(promotionForm.percent_off), max_redemptions: promotionForm.max_redemptions ? Number(promotionForm.max_redemptions) : null }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "The discount could not be created. Please try again.");
      setNotice(`Discount code ${result?.promotion?.code || promotionForm.code.toUpperCase()} created.`); setPromotionForm({ name: "", code: "", percent_off: "15", max_redemptions: "" }); await loadPromotions();
    } catch (error) { setNotice(error instanceof Error ? error.message : "The discount could not be created."); }
    finally { setBusy(false); }
  }
  async function deactivatePromotion(item: PromotionRow) {
    setRowBusy(item.id); setNotice("");
    try {
      const response = await fetch("/api/admin/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deactivate", id: item.id }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "The discount could not be disabled.");
      setNotice(`Discount code ${item.code} disabled.`); await loadPromotions();
    } catch (error) { setNotice(error instanceof Error ? error.message : "The discount could not be disabled."); }
    finally { setRowBusy(null); }
  }

  async function loadForTab(nextTab: Tab) {
    setNotice("");
    try {
      if (nextTab === "Content" || nextTab === "Events") await loadContent();
      if (nextTab === "Categories") await loadCategories();
      if (nextTab === "Home shelves") { await Promise.all([loadSections(), loadContent(), loadAssignments()]); }
      if (nextTab === "School codes") await loadCodes();
      if (nextTab === "Mailing list") await loadMailingList();
      if (nextTab === "Members") await loadMembers();
      if (nextTab === "Discounts") await loadPromotions();
    } catch (error) {
      setNotice(friendlyError(error, `The ${nextTab.toLowerCase()} list could not be loaded. Please try again.`));
    }
  }
  // The tab is the trigger; loadForTab is intentionally invoked with the current render's handlers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadForTab(tab); }, [tab]);

  async function changeStatus(id: string, status: "draft" | "published" | "archived") {
    setRowBusy(id); setNotice("");
    try {
      const response = await fetch(`/api/admin/content/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "We could not update that item. Please try again.");
      setNotice(`Content ${status}.`); await loadContent();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setRowBusy(null); }
  }

  async function submitContent(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      if (!media || !thumb) throw new Error("Choose both the media file and thumbnail.");
      const slug = `${Date.now()}-${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
      async function upload(file: File, kind: "media" | "thumbnail") {
        const response = await fetch("/api/admin/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: `${kind}/${slug}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`, contentType: file.type, contentLength: file.size, isPublic: kind === "thumbnail" }) });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Upload could not be started. Please try again.");
        const uploaded = await fetch(result.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!uploaded.ok) throw new Error(`The ${kind === "media" ? "media" : "thumbnail"} upload failed. Check your R2 bucket CORS settings and try again.`);
        return result.key as string;
      }
      const mediaKey = await upload(media, "media");
      const thumbnailKey = await upload(thumb, "thumbnail");
      const response = await fetch("/api/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, ...(form.type === "event" ? { event_starts_at: eventForm.starts_at ? new Date(eventForm.starts_at).toISOString() : null, event_ends_at: eventForm.ends_at ? new Date(eventForm.ends_at).toISOString() : null, event_location: eventForm.location.trim() || null, capacity: eventForm.capacity ? Number(eventForm.capacity) : null, registration_url: eventForm.registration_url.trim() || null } : {}), slug, r2_media_key: mediaKey, r2_thumbnail_key: thumbnailKey }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Content could not be published. Please try again.");
      setNotice("Content published successfully.");
      setForm({ title: "", type: "podcast", description: "", category: "", member_only: false, featured: false });
      setEventForm({ starts_at: "", ends_at: "", location: "", capacity: "", registration_url: "" });
      setMedia(null); setThumb(null); await loadContent();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  async function createCategory(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    const name = categoryForm.name.trim();
    const slug = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (name.length < 2 || !slug) { setNotice("Enter a category name with at least two characters."); setBusy(false); return; }
    try {
      const { error } = await db.from("categories").insert({ name, slug, description: categoryForm.description.trim() || null, is_active: true, display_order: categories.length });
      if (error) throw error;
      setCategoryForm({ name: "", description: "" }); setNotice("Category created."); await loadCategories();
    } catch (error) { setNotice(friendlyError(error, "The category could not be created. Check that its name is unique.")); }
    finally { setBusy(false); }
  }

  async function toggleCategory(item: CategoryRow) {
    setRowBusy(item.id); setNotice("");
    try { const { error } = await db.from("categories").update({ is_active: !item.is_active, updated_at: new Date().toISOString() }).eq("id", item.id); if (error) throw error; await loadCategories(); }
    catch (error) { setNotice(friendlyError(error, "The category could not be updated.")); }
    finally { setRowBusy(null); }
  }

  async function toggleSection(item: SectionRow, field: "is_active" | "show_on_homepage") {
    setRowBusy(item.id); setNotice("");
    try { const update = field === "is_active" ? { is_active: !item.is_active, updated_at: new Date().toISOString() } : { show_on_homepage: !item.show_on_homepage, updated_at: new Date().toISOString() }; const { error } = await db.from("sections").update(update).eq("id", item.id); if (error) throw error; await loadSections(); setNotice("Homepage shelf settings saved."); }
    catch (error) { setNotice(friendlyError(error, "The shelf settings could not be updated.")); }
    finally { setRowBusy(null); }
  }

  async function createSchoolCode(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    const schoolName = codeForm.school_name.trim();
    if (schoolName.length < 2) { setNotice("Enter the school name."); setBusy(false); return; }
    const code = makeSchoolCode();
    try {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
      const codeHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const { data: authData } = await db.auth.getUser();
      const { error } = await db.from("school_codes").insert({ code_hash: codeHash, school_name: schoolName, active: true, max_uses: codeForm.max_uses ? Number(codeForm.max_uses) : 100000, uses: 0, expires_at: codeForm.expires_at ? new Date(`${codeForm.expires_at}T23:59:59`).toISOString() : null, created_by: authData.user?.id ?? null });
      if (error) throw error;
      setCodeValue(code); setCodeForm({ school_name: "", max_uses: "", expires_at: "" }); setNotice("School access code created. Copy it now and share it only with the intended school."); await loadCodes();
    } catch (error) { setNotice(friendlyError(error, "The school code could not be created. Check the administrator policy and try again.")); }
    finally { setBusy(false); }
  }

  async function toggleCode(item: CodeRow) {
    setRowBusy(item.id); setNotice("");
    try { const { error } = await db.from("school_codes").update({ active: !item.active }).eq("id", item.id); if (error) throw error; await loadCodes(); }
    catch (error) { setNotice(friendlyError(error, "The code could not be updated.")); }
    finally { setRowBusy(null); }
  }

  const visibleItems = tab === "Events" ? items.filter((item) => item.type === "event") : items;

  return <div className="admin-studio" style={{ marginTop: 30 }}>
    <div className="studio-header"><div><div className="eyebrow">Private Studio</div><h2>Manage Teens2Inspire</h2><p>Signed in as {email}</p></div><div className="studio-header-note">Changes save to the live database.</div></div>
    <div className="studio-tabs" role="tablist" aria-label="Admin Studio sections">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? "studio-tab active" : "studio-tab"} onClick={() => setTab(item)}>{item}</button>)}</div>
    {notice && <p className="studio-notice" role="status">{notice}{codeValue && tab === "School codes" ? <strong className="code-result">New code: {codeValue} <button type="button" className="btn" onClick={() => { void navigator.clipboard?.writeText(codeValue); }}>Copy</button></strong> : null}</p>}

    {(tab === "Content" || tab === "Events") && <>
      {tab === "Content" && <section className="feature-card studio-form-card"><h3>Upload and publish</h3><p>Media files are stored in the private R2 bucket. Artwork is stored in the public assets bucket.</p><form onSubmit={submitContent}>
        <div className="wide-grid"><div className="field"><label htmlFor="studio-title">Title</label><input id="studio-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={180} required /></div>
        <div className="field"><label htmlFor="studio-type">Content type</label><select id="studio-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{contentTypes.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></div>
        <div className="field"><label htmlFor="studio-category">Category</label><input id="studio-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} maxLength={80} /></div></div>
        <div className="field"><label htmlFor="studio-description">Description</label><textarea id="studio-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} maxLength={4000} /></div>
        {form.type === "event" && <div className="wide-grid studio-event-fields"><div className="field"><label htmlFor="event-start">Starts at</label><input id="event-start" type="datetime-local" value={eventForm.starts_at} onChange={(event) => setEventForm({ ...eventForm, starts_at: event.target.value })} /></div><div className="field"><label htmlFor="event-end">Ends at</label><input id="event-end" type="datetime-local" value={eventForm.ends_at} onChange={(event) => setEventForm({ ...eventForm, ends_at: event.target.value })} /></div><div className="field"><label htmlFor="event-location">Location</label><input id="event-location" value={eventForm.location} onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })} maxLength={180} /></div><div className="field"><label htmlFor="event-capacity">Capacity (optional)</label><input id="event-capacity" type="number" min="1" max="100000" value={eventForm.capacity} onChange={(event) => setEventForm({ ...eventForm, capacity: event.target.value })} /></div><div className="field"><label htmlFor="event-registration">Registration URL (optional)</label><input id="event-registration" type="url" value={eventForm.registration_url} onChange={(event) => setEventForm({ ...eventForm, registration_url: event.target.value })} placeholder="https://…" /></div></div>}
        <div className="wide-grid studio-upload-grid"><div className="field"><label htmlFor="studio-media">Media file</label><input id="studio-media" type="file" accept="audio/*,video/mp4,video/webm,video/quicktime,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setMedia(event.target.files?.[0] || null)} required /><small>Audio, video, PDF, or image. Maximum 2 GB.</small></div><div className="field"><label htmlFor="studio-thumbnail">Thumbnail</label><input id="studio-thumbnail" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setThumb(event.target.files?.[0] || null)} required /><small>JPEG, PNG, WebP, or AVIF. Maximum 10 MB.</small></div></div>
        <div className="studio-checks"><label><input type="checkbox" checked={form.member_only} onChange={(event) => setForm({ ...form, member_only: event.target.checked })} /> Members only</label><label><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Feature on home page</label></div>
        <button className="btn primary" disabled={busy}>{busy ? "Uploading…" : "Upload and publish"}</button>
      </form></section>}
      <section className="section studio-list-section"><div className="section-head"><h2>{tab === "Events" ? "Events" : "Content library"}</h2><span>{visibleItems.length} items loaded</span></div>{visibleItems.map((item) => <div key={item.id} className="studio-content-row"><div className="studio-content-main"><strong>{item.title}</strong><span>{item.type} · {item.status}{item.event_starts_at ? ` · ${new Date(item.event_starts_at).toLocaleString()}` : ""}{item.event_location ? ` · ${item.event_location}` : ""}{item.member_only ? " · Members only" : " · Public"}{item.featured ? " · Featured" : ""}</span></div><div className="studio-content-actions">{item.status !== "published" && <button className="btn" type="button" disabled={rowBusy === item.id} onClick={() => changeStatus(item.id, "published")}>{rowBusy === item.id ? "Saving…" : "Publish"}</button>}{item.status === "published" && <button className="btn" type="button" disabled={rowBusy === item.id} onClick={() => changeStatus(item.id, "archived")}>{rowBusy === item.id ? "Saving…" : "Archive"}</button>}</div></div>)}{!visibleItems.length && <p className="page-sub">No items found for this section yet.</p>}</section>
    </>}

    {tab === "Categories" && <section className="feature-card studio-form-card"><h3>Categories</h3><form onSubmit={createCategory}><div className="wide-grid"><div className="field"><label htmlFor="category-name">Category name</label><input id="category-name" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} required maxLength={80} /></div><div className="field"><label htmlFor="category-description">Description (optional)</label><input id="category-description" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} maxLength={300} /></div></div><button className="btn primary" disabled={busy}>{busy ? "Saving…" : "Create category"}</button></form><div className="studio-list-section">{categories.map((item) => <div className="studio-content-row" key={item.id}><div className="studio-content-main"><strong>{item.name}</strong><span>/{item.slug} · order {item.display_order} · {item.is_active ? "Active" : "Hidden"}</span></div><div className="studio-content-actions"><button type="button" className="btn" disabled={rowBusy === item.id} onClick={() => toggleCategory(item)}>{item.is_active ? "Hide" : "Activate"}</button></div></div>)}</div></section>}

    {tab === "Home shelves" && <section className="feature-card studio-form-card"><h3>Home page shelves</h3><p>Control visibility and choose exactly which published content appears in each shelf. Order is managed by the order in which items are added.</p>{sections.map((item) => <div className="studio-shelf-editor" key={item.id}><div className="studio-shelf-editor-head"><div className="studio-content-main"><strong>{item.name}</strong><span>/{item.slug} · order {item.display_order} · up to {item.max_items} items</span></div><div className="studio-switches"><label><input type="checkbox" checked={item.is_active} disabled={rowBusy === item.id} onChange={() => toggleSection(item, "is_active")} /> Active</label><label><input type="checkbox" checked={item.show_on_homepage} disabled={rowBusy === item.id} onChange={() => toggleSection(item, "show_on_homepage")} /> Show on home</label></div></div><div className="studio-shelf-add"><select aria-label={`Choose content for ${item.name}`} value={assignmentSelection[item.id] || ""} onChange={(event) => setAssignmentSelection({ ...assignmentSelection, [item.id]: event.target.value })}><option value="">Choose published content…</option>{items.filter((content) => content.status === "published").map((content) => <option key={content.id} value={content.id}>{content.title}</option>)}</select><button className="btn" type="button" disabled={rowBusy === item.id} onClick={() => assignContent(item.id)}>Add item</button></div><div className="studio-assignment-list">{assignments.filter((assignment) => assignment.section_id === item.id).map((assignment) => { const content = items.find((candidate) => candidate.id === assignment.content_id); return <div key={assignment.content_id}><span>{content?.title || "Linked content"}</span><button type="button" className="text-button" disabled={rowBusy === `${item.id}:${assignment.content_id}`} onClick={() => removeAssignment(item.id, assignment.content_id)}>Remove</button></div>; })}{!assignments.some((assignment) => assignment.section_id === item.id) && <small>No manually assigned content. This shelf will show the latest content matching its section type.</small>}</div></div>)}{!sections.length && <p className="page-sub">No shelves were found. Check that the sections table has been set up.</p>}</section>}

    {tab === "School codes" && <section className="feature-card studio-form-card"><h3>Create a school access code</h3><p>Codes are generated securely in the browser and saved as a one-way hash in the school code table. Share each code only with the intended school.</p><form onSubmit={createSchoolCode}><div className="wide-grid"><div className="field"><label htmlFor="school-name">School name</label><input id="school-name" value={codeForm.school_name} onChange={(event) => setCodeForm({ ...codeForm, school_name: event.target.value })} required maxLength={120} /></div><div className="field"><label htmlFor="school-max-uses">Maximum uses (optional)</label><input id="school-max-uses" type="number" min="1" max="100000" value={codeForm.max_uses} onChange={(event) => setCodeForm({ ...codeForm, max_uses: event.target.value })} /></div><div className="field"><label htmlFor="school-expires">Expiration date (optional)</label><input id="school-expires" type="date" value={codeForm.expires_at} onChange={(event) => setCodeForm({ ...codeForm, expires_at: event.target.value })} /></div></div><button className="btn primary" disabled={busy}>{busy ? "Creating…" : "Generate school code"}</button></form><div className="studio-list-section">{codes.map((item) => <div className="studio-content-row" key={item.id}><div className="studio-content-main"><strong>{item.school_name}</strong><span>{item.uses}/{item.max_uses} uses{item.expires_at ? ` · expires ${new Date(item.expires_at).toLocaleDateString()}` : " · no expiration"} · {item.active ? "Active" : "Disabled"}</span></div><div className="studio-content-actions"><button className="btn" type="button" disabled={rowBusy === item.id} onClick={() => toggleCode(item)}>{item.active ? "Disable" : "Enable"}</button></div></div>)}</div></section>}


    {tab === "Discounts" && <section className="feature-card studio-form-card"><h3>Stripe promotion codes</h3><p>Create one-time percentage discounts that customers can enter during Stripe Checkout. These are real Stripe promotion codes; they do not change membership prices until redeemed.</p><form onSubmit={createPromotion}><div className="wide-grid"><div className="field"><label htmlFor="promotion-name">Internal name</label><input id="promotion-name" value={promotionForm.name} onChange={(event) => setPromotionForm({ ...promotionForm, name: event.target.value })} required minLength={2} maxLength={100} /></div><div className="field"><label htmlFor="promotion-code">Code</label><input id="promotion-code" value={promotionForm.code} onChange={(event) => setPromotionForm({ ...promotionForm, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} required minLength={4} maxLength={32} pattern="[A-Z0-9_-]{4,32}" placeholder="TEENS15" /></div><div className="field"><label htmlFor="promotion-percent">Percent off</label><input id="promotion-percent" type="number" min="1" max="100" value={promotionForm.percent_off} onChange={(event) => setPromotionForm({ ...promotionForm, percent_off: event.target.value })} required /></div><div className="field"><label htmlFor="promotion-limit">Maximum redemptions (optional)</label><input id="promotion-limit" type="number" min="1" max="100000" value={promotionForm.max_redemptions} onChange={(event) => setPromotionForm({ ...promotionForm, max_redemptions: event.target.value })} /></div></div><button className="btn primary" disabled={busy}>{busy ? "Creating…" : "Create Stripe discount"}</button></form><div className="studio-list-section">{promotions.map((item) => <div className="studio-content-row" key={item.id}><div className="studio-content-main"><strong>{item.code} — {item.name}</strong><span>{item.percent_off !== null ? `${item.percent_off}% off` : item.amount_off !== null ? `${(item.amount_off / 100).toFixed(2)} ${item.currency || "USD"} off` : "Discount"} · {item.times_redeemed}{item.max_redemptions ? `/${item.max_redemptions}` : " redemptions"} · {item.active ? "Active" : "Disabled"}</span></div><div className="studio-content-actions">{item.active && <button className="btn" type="button" disabled={rowBusy === item.id} onClick={() => deactivatePromotion(item)}>{rowBusy === item.id ? "Saving…" : "Disable"}</button>}</div></div>)}{!promotions.length && <p className="page-sub">No Stripe promotion codes were found.</p>}</div></section>}

    {tab === "Mailing list" && <section className="feature-card studio-form-card"><h3>Mailing list</h3><p>Latest 200 signups. Exporting and email campaigns should be handled through your approved mailing provider.</p>{mailing.map((item) => <div className="studio-content-row" key={item.id}><div className="studio-content-main"><strong>{item.email}</strong><span>{item.first_name || item.display_name || "Subscriber"} · {item.subscribed ? "Subscribed" : "Unsubscribed"}{item.status ? ` · ${item.status}` : ""}</span></div><span className="studio-muted">{new Date(item.created_at).toLocaleDateString()}</span></div>)}{!mailing.length && <p className="page-sub">No mailing-list signups were found.</p>}</section>}

    {tab === "Members" && <section className="feature-card studio-form-card"><h3>Member accounts</h3><p>Latest 200 profiles. Billing changes should be completed through the Stripe customer portal.</p>{members.map((item) => <div className="studio-content-row" key={item.id}><div className="studio-content-main"><strong>{item.display_name || item.first_name || "Member"}</strong><span>{item.membership_tier} · {item.membership_status || "No active status"} · {item.role}{item.membership_period_end ? ` · through ${new Date(item.membership_period_end).toLocaleDateString()}` : ""}</span></div><span className="studio-muted">{new Date(item.created_at).toLocaleDateString()}</span></div>)}{!members.length && <p className="page-sub">No profiles were found.</p>}</section>}
  </div>;
}
