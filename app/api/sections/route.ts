import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminAudit } from "@/lib/admin-audit";
import { isSameOriginRequest } from "@/lib/same-origin";

const UUID = /^[0-9a-f-]{36}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TYPES = ["collection", "editorial", "seasonal", "featured"];
async function adminContext() {
  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: "Sections are unavailable right now." }, { status: 503 }) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "administrator") return { error: NextResponse.json({ error: "Only the Teens2Inspire owner can manage sections." }, { status: 403 }) };
  return { supabase, user };
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "This request was not allowed." }, { status: 403 });
  const context = await adminContext(); if ("error" in context) return context.error;
  const { supabase, user } = context;
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid section details." }, { status: 400 }); }
  const action = String(body.action || "save");
  if (action === "archive" || action === "toggle") {
    const id = String(body.id || ""); if (!UUID.test(id)) return NextResponse.json({ error: "Choose a valid section." }, { status: 400 });
    const nextActive = action === "toggle" ? body.is_active === true : false;
    const { error } = await supabase.from("sections").update({ is_active: nextActive, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: "We couldn’t update this section." }, { status: 400 });
    await writeAdminAudit(user.id, nextActive ? "section_activated" : "section_archived", "section", id);
    return NextResponse.json({ ok: true });
  }
  if (action === "reorder") {
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (ids.length > 100 || ids.some((id) => !UUID.test(id))) return NextResponse.json({ error: "Section order is invalid." }, { status: 400 });
    for (const [index, id] of ids.entries()) {
      const { error } = await supabase.from("sections").update({ display_order: index, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ error: "Section order couldn’t be saved." }, { status: 400 });
    }
    await writeAdminAudit(user.id, "sections_reordered", "section", null, { count: ids.length });
    return NextResponse.json({ ok: true });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const name = String(body.name || "").trim(); const slug = String(body.slug || "").trim();
  const sectionType = String(body.section_type || "collection");
  const maxItems = Number(body.max_items || 6); const order = Number(body.display_order || 0);
  if ((id && !UUID.test(id)) || name.length < 1 || name.length > 100 || !SLUG.test(slug) || !TYPES.includes(sectionType) || !Number.isInteger(maxItems) || maxItems < 1 || maxItems > 24 || !Number.isInteger(order) || order < 0) return NextResponse.json({ error: "Check the section name, web address, type, order, and item limit." }, { status: 400 });
  const rawContentIds = Array.isArray(body.content_ids) ? body.content_ids.map(String) : [];
  const contentIds = [...new Set(rawContentIds)];
  if (contentIds.length > 200 || contentIds.some((contentId) => !UUID.test(contentId))) return NextResponse.json({ error: "Choose valid content items." }, { status: 400 });
  const record = { name, slug, description: String(body.description || "").trim().slice(0, 2000) || null, artwork_url: null, background_image_url: null, section_type: sectionType, display_order: order, is_active: body.is_active !== false, show_on_homepage: body.show_on_homepage !== false, show_in_navigation: body.show_in_navigation === true, card_style: ["poster", "landscape", "compact"].includes(String(body.card_style)) ? String(body.card_style) : "poster", max_items: maxItems, see_all_label: String(body.see_all_label || "See all").trim().slice(0, 32) || "See all", updated_at: new Date().toISOString() };
  let sectionId = id;
  if (id) {
    const { error } = await supabase.from("sections").update(record).eq("id", id);
    if (error) return NextResponse.json({ error: error.code === "23505" ? "That section address is already in use." : "We couldn’t save this section." }, { status: 400 });
  } else {
    const { data, error } = await supabase.from("sections").insert(record).select("id").single();
    if (error || !data) return NextResponse.json({ error: error?.code === "23505" ? "That section address is already in use." : "We couldn’t create this section." }, { status: 400 });
    sectionId = data.id;
  }
  const { error: assignmentError } = await supabase.rpc("replace_section_content", { p_section_id: sectionId, p_content_ids: contentIds });
  if (assignmentError) return NextResponse.json({ error: "The section was saved, but its content order could not be saved. Please retry the section update." }, { status: 503 });
  await writeAdminAudit(user.id, id ? "section_updated" : "section_created", "section", sectionId, { name, content_count: contentIds.length });
  return NextResponse.json({ ok: true, id: sectionId }, { status: id ? 200 : 201 });
}
