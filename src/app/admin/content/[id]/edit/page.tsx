import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { updateContent } from "../../actions";
import { AdminUploadForm } from "@/components/admin-upload-form";
import { R2MediaUpload } from "@/components/r2-media-upload";
import { CaptionFileUpload } from "@/components/caption-file-upload";
import { ContentLanguageEditor } from "@/components/content-language-editor";

const TYPES = ["video", "podcast", "article", "resource", "printable", "pick", "event", "recipe", "original"];

export default async function EditContent({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<{error?:string}> }) {
 const { id } = await params;
 if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
 const { supabase } = await requireAdmin();
 const [{data:item},{data:sections},{data:assignments},{data:translations}] = await Promise.all([
   supabase.from("content").select("id,title,slug,type,status,description,category,tags,cover_url,external_url,r2_media_key,duration_seconds,caption_path,caption_language,body,member_only,featured").eq("id",id).maybeSingle(),
   supabase.from("sections").select("id,name").order("display_order"),
   supabase.from("section_content").select("section_id").eq("content_id", id).limit(1),
   supabase.from("content_translations").select("language,title,description,body").eq("content_id",id),
 ]);
 if(!item) notFound();
 const {error} = await searchParams;
 return <div className="studio-editor-page"><Link href="/admin/content" className="studio-back-link">← All content</Link><div className="studio-editor-heading"><div><span className="studio-eyebrow">EDIT EXISTING CONTENT</span><h1>Edit {item.title}</h1><p>Update the same Supabase record, including title, description, media, artwork, and publishing settings. Choosing a replacement file uploads it when you save.</p></div></div>
 {error && <p role="alert" className="notice">{error === "duplicate-slug" ? "That slug is already taken." : "Changes could not be fully saved. Check the fields or section and try again."}</p>}
 <AdminUploadForm action={updateContent} className="studio-form"><input name="id" type="hidden" value={id}/>
  <section className="studio-form-section"><h2>Content details</h2><div className="studio-form-grid"><label>Title *<input name="title" required maxLength={140} defaultValue={item.title}/></label><label>Slug<input name="slug" maxLength={90} defaultValue={item.slug || ""}/></label><label>Type<select name="type" defaultValue={item.type}>{TYPES.map(t=><option value={t} key={t}>{t}</option>)}</select></label><label>Category<input name="category" maxLength={80} defaultValue={item.category || ""}/></label><label>Tags (comma separated)<input name="tags" defaultValue={Array.isArray(item.tags)?item.tags.join(", "):""}/></label><label className="studio-field-wide">Description<textarea name="description" rows={5} maxLength={5000} defaultValue={item.description || ""}/></label><label className="studio-field-wide">Article, recipe, or resource body<textarea name="body_content" rows={9} maxLength={30000} defaultValue={item.body || ""}/></label></div></section>
  <section className="studio-form-section"><h2>Cover and media</h2><p>Existing files remain in place until you select a replacement. One Save uploads selected files and updates the content.</p><div className="studio-form-grid"><div className="studio-field-wide"><R2MediaUpload fieldName="cover_url" artwork defaultValue={item.cover_url}/></div><div className="studio-field-wide"><R2MediaUpload defaultValue={item.r2_media_key}/></div><div className="studio-field-wide"><CaptionFileUpload defaultPath={item.caption_path} defaultLanguage={item.caption_language}/></div><label className="studio-field-wide">External player or download URL<input name="external_url" type="url" defaultValue={item.external_url || ""}/></label><label>Duration (seconds)<input name="duration_seconds" type="number" min={0} max={86400} defaultValue={item.duration_seconds ?? ""}/></label></div></section>
  <ContentLanguageEditor translations={translations || []}/>
  <section className="studio-form-section"><h2>Publishing</h2><div className="studio-form-grid"><label>Status<select name="status" defaultValue={item.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label>Add to collection<select name="section_id" defaultValue={assignments?.[0]?.section_id || ""}><option value="">Keep current collections</option>{(sections || []).map(section=><option key={section.id} value={section.id}>{section.name}</option>)}</select><small>Choosing a new collection adds it; existing collection assignments remain intact.</small></label><label className="studio-check"><input name="member_only" type="checkbox" defaultChecked={item.member_only}/> Members only</label><label className="studio-check"><input name="featured" type="checkbox" defaultChecked={item.featured}/> Featured</label></div></section>
 <div className="studio-form-actions"><Link href="/admin/content" className="studio-secondary-button">Cancel</Link><button className="studio-primary-button" type="submit">Upload & save changes →</button></div>
 </AdminUploadForm></div>;
}
