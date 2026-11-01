"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Check, ImagePlus, LoaderCircle, Play, Save, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SitePopup } from "@/lib/site-popup";
import { saveSitePopup } from "@/app/admin/popup/actions";

const accepted = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";
export function SitePopupEditor({ initial, initialMediaUrl }: { initial: SitePopup; initialMediaUrl: string | null }) {
  const [current, setCurrent] = useState(initial);
  const [mediaUrl, setMediaUrl] = useState(initialMediaUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, startSaving] = useTransition();
  const update = (field: keyof SitePopup, value: string | boolean | null) => setCurrent(prev => ({...prev, [field]: value}));
  async function upload(file?: File) {
    if (!file) return;
    setUploadError(""); setUploadProgress("");
    const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
    if (!kind || !accepted.split(",").includes(file.type)) { setUploadError("Choose a JPG, PNG, WebP, GIF, MP4, MOV or WebM file."); return; }
    if (file.size > 80 * 1024 * 1024) { setUploadError("Maximum file size is 80 MB. Export a smaller video first."); return; }
    const extension = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"}[file.type];
    if (!extension) return;
    setUploading(true); setUploadProgress("Uploading to Supabase Storage…");
    try {
      const supabase = createClient();
      const path = `popup/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("site-popup-media").upload(path, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
      if (error) throw error;
      const url = supabase.storage.from("site-popup-media").getPublicUrl(path).data.publicUrl;
      setCurrent(prev => ({...prev, media_path:path, media_kind:kind, media_alt:prev.media_alt || file.name}));
      setMediaUrl(url);
      setUploadProgress("Upload complete. Click Save changes to publish your selection.");
    } catch (error) { setUploadError(error instanceof Error ? error.message : "Upload failed. Check storage setup and try again."); }
    finally { setUploading(false); }
  }
  return <div className="popup-editor-layout">
    <section className="popup-editor-card">
      <div className="popup-editor-card-header"><span>01 / MESSAGE & VISIBILITY</span><h2>Build your announcement</h2><p>Everything is editable. Save to Supabase to apply changes to the public website.</p></div>
      <form action={form => startSaving(() => saveSitePopup(form))} className="popup-editor-form">
        <label className="popup-publish-switch"><span><strong>{current.is_enabled ? "Pop-up enabled" : "Pop-up paused"}</strong><small>{current.is_enabled ? "Visitors can see this announcement" : "Nothing will appear to visitors"}</small></span><input type="checkbox" name="is_enabled" checked={current.is_enabled} onChange={e => update("is_enabled", e.target.checked)}/><span className="popup-switch-track" aria-hidden="true"/></label>
        <div className="popup-input-grid"><label>Eyebrow / short heading<input value={current.eyebrow} onChange={e=>update("eyebrow",e.target.value)} name="eyebrow" maxLength={90} placeholder="NEW & NOTEWORTHY"/></label><label>Button text<input name="cta_label" value={current.cta_label} onChange={e=>update("cta_label",e.target.value)} maxLength={55} required/></label></div>
        <label>Main title<input name="title" value={current.title} onChange={e=>update("title",e.target.value)} maxLength={140} required placeholder="Something new is here"/></label>
        <label>Message<textarea name="body" rows={5} value={current.body} onChange={e=>update("body",e.target.value)} maxLength={1200}/></label>
        <label>Button destination<input name="cta_href" value={current.cta_href} onChange={e=>update("cta_href",e.target.value)} required placeholder="/signup or https://…"/><small>Use an existing site path (like /signup), or a secure HTTPS URL.</small></label>
        <div className="popup-editor-media-block"><div className="popup-editor-card-header"><span>02 / MEDIA</span><h3>Image or video</h3><p>Upload directly from your device. No media URLs required.</p></div>
          <label className="popup-upload-box"><UploadCloud size={24}/><strong>{uploading ? "Uploading…" : "Choose an image or video"}</strong><small>JPG, PNG, WebP, GIF, MP4, MOV or WebM · Maximum 80 MB</small><input type="file" accept={accepted} disabled={uploading || saving} onChange={e => {void upload(e.target.files?.[0]); e.target.value="";}}/></label>
          {uploadProgress && <p className="popup-upload-message" role="status"><Check size={15}/>{uploadProgress}</p>}
          {uploadError && <p className="popup-upload-error" role="alert">{uploadError}</p>}
          {current.media_path && <div className="popup-selected-media"><ImagePlus size={17}/><span>{current.media_path.split("/").pop()} <small>{current.media_kind === "video" ? "Video selected" : "Image selected"}</small></span><button type="button" onClick={()=>{setCurrent(p=>({...p,media_path:null,media_kind:null}));setMediaUrl(null);setUploadProgress("Image/video will be removed from the announcement after you save.");}} aria-label="Remove selected media"><Trash2 size={17}/></button></div>}
          <label>Media accessibility description<input name="media_alt" maxLength={180} value={current.media_alt} onChange={e=>update("media_alt",e.target.value)} placeholder="Describe the image or video"/></label>
        </div>
        <input type="hidden" name="media_path" value={current.media_path || ""}/><input type="hidden" name="media_kind" value={current.media_kind || ""}/>
        <div className="popup-form-actions"><button className="popup-save" type="submit" disabled={saving || uploading}>{saving ? <LoaderCircle size={17} className="animate-spin"/>:<Save size={17}/>} {saving ? "Saving…" : "Save changes"}</button><button type="button" className="popup-preview-toggle" onClick={()=>setPreview(p=>!p)}>{preview ? "Close full preview" : "Preview pop-up"} <ArrowUpRight size={17}/></button></div>
      </form>
    </section>
    <aside className="popup-preview-column"><div className="popup-preview-topline"><span>LIVE PREVIEW</span><span className={`popup-status ${current.is_enabled ? "is-live" : "is-paused"}`}>{current.is_enabled ? "Ready to show" : "Disabled"}</span></div>
      <div className="popup-preview-frame"><div className="popup-preview-art">{mediaUrl ? current.media_kind === "video" ? <video src={mediaUrl} controls playsInline preload="metadata"/>:<img src={mediaUrl} alt={current.media_alt}/> : <span><Play size={28}/><small>Your promotional visual goes here</small></span>}</div><div className="popup-preview-copy"><span>{current.eyebrow || "ANNOUNCEMENT"}</span><h3>{current.title || "Your announcement title"}</h3><p>{current.body || "Your announcement message will appear here."}</p><div>{current.cta_label || "Learn more"} <ArrowUpRight size={15}/></div></div></div><p className="popup-preview-note">Preview shows draft changes. Visitors see changes only after you save and enable the pop-up.</p>
    </aside>
    {preview && <div className="popup-admin-preview-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setPreview(false);}}><div className="popup-dialog promo-dialog with-media"><button className="promo-close" type="button" onClick={()=>setPreview(false)} aria-label="Close preview">×</button>{mediaUrl && <div className="promo-media">{current.media_kind === "video" ? <video controls playsInline src={mediaUrl}/> : <img src={mediaUrl} alt={current.media_alt}/>}</div>}<div className="promo-copy"><span className="promo-kicker">{current.eyebrow}</span><h2>{current.title}</h2><p>{current.body}</p><span className="promo-action">{current.cta_label} <ArrowUpRight size={18}/></span><span className="promo-brand">PREVIEW ONLY — NOT PUBLISHED</span></div></div></div>}
  </div>;
}
