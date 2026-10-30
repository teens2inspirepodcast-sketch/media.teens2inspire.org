import { requireAdmin } from "@/lib/auth";
import { updateMarketingSetting } from "./actions";
import { EDITABLE_MARKETING_FIELDS as metadata } from "@/lib/editable-marketing-fields";
import { AdminUploadForm } from "@/components/admin-upload-form";
import { SiteAssetUpload } from "@/components/site-asset-upload";
export default async function SiteSettingsAdmin({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data, error } = await supabase.from("marketing_settings").select("setting_key,setting_value,updated_at").order("setting_key");
  const values = new Map((data || []).map(row => [row.setting_key, row]));
  return <div className="studio-editor-page"><div className="studio-welcome"><div><span className="studio-eyebrow">PUBLIC WEBSITE CMS</span><h1>Website editor</h1><p>Edit website text, hero images, logos, and page introductions shown on teens2inspire.org. The public site reads these values from Supabase when it renders.</p></div></div>
    {params.error && <p className="notice" role="alert">{params.error === "invalid" ? "Choose a listed field and enter its text." : "The setting could not be saved."}</p>}{params.saved && <p className="notice">Saved. The marketing website will show the new text on its next render.</p>}{error && <p className="notice" role="alert">Settings could not be loaded. Apply the marketing CMS migration.</p>}
    <div className="site-settings-grid">{Object.entries(metadata).map(([key,meta])=>{const row=values.get(key);return <section className="studio-form-section site-setting-card" key={key}><h2>{meta.label}</h2><p>{meta.help}</p><AdminUploadForm action={updateMarketingSetting}><input type="hidden" name="setting_key" value={key}/>{meta.image ? <SiteAssetUpload fieldName="setting_value" label={meta.label} initialValue={row?.setting_value || ""} /> : meta.multiline ? <textarea name="setting_value" required maxLength={8000} rows={5} defaultValue={row?.setting_value || ""}/> : <input name="setting_value" required maxLength={8000} defaultValue={row?.setting_value || ""}/>}<div className="site-setting-footer"><span>{row?.updated_at ? `Last saved ${new Date(row.updated_at).toLocaleString()}` : "Not saved yet"}</span><button className="studio-primary-button" type="submit">Save</button></div></AdminUploadForm></section>})}</div>
  </div>;
}
