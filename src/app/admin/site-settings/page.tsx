import { requireAdmin } from "@/lib/auth";
import { updateMarketingSetting } from "./actions";
const metadata: Record<string, { label: string; help: string; multiline?: boolean }> = {
  home_hero_title: { label: "Homepage headline", help: "The main headline on teens2inspire.org." },
  home_hero_subtitle: { label: "Homepage introduction", help: "The introductory paragraph under the homepage headline.", multiline: true },
  mission_title: { label: "Mission headline", help: "Used on the homepage manifesto and About page." },
  mission_body: { label: "Mission description", help: "The shared mission text used on the homepage and About page.", multiline: true },
  founder_bio: { label: "Founder bio — Goldie Fishbaum", help: "About page biography. Keep details you do not want public out of this field.", multiline: true },
  podcast_description: { label: "Podcast description", help: "Description under the Podcast heading.", multiline: true },
};
export default async function SiteSettingsAdmin({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data, error } = await supabase.from("marketing_settings").select("setting_key,setting_value,updated_at").order("setting_key");
  const values = new Map((data || []).map(row => [row.setting_key, row]));
  return <div className="studio-editor-page"><div className="studio-welcome"><div><span className="studio-eyebrow">PUBLIC WEBSITE CMS</span><h1>Site & about copy</h1><p>Edit the main copy shown on teens2inspire.org. The public site reads these values from Supabase when it renders.</p></div></div>
    {params.error && <p className="notice" role="alert">{params.error === "invalid" ? "Choose a listed field and enter its text." : "The setting could not be saved."}</p>}{params.saved && <p className="notice">Saved. The marketing website will show the new text on its next render.</p>}{error && <p className="notice" role="alert">Settings could not be loaded. Apply the marketing CMS migration.</p>}
    <div className="site-settings-grid">{Object.entries(metadata).map(([key,meta])=>{const row=values.get(key);return <section className="studio-form-section site-setting-card" key={key}><h2>{meta.label}</h2><p>{meta.help}</p><form action={updateMarketingSetting}><input type="hidden" name="setting_key" value={key}/>{meta.multiline ? <textarea name="setting_value" required maxLength={8000} rows={5} defaultValue={row?.setting_value || ""}/> : <input name="setting_value" required maxLength={8000} defaultValue={row?.setting_value || ""}/>}<div className="site-setting-footer"><span>{row?.updated_at ? `Last saved ${new Date(row.updated_at).toLocaleString()}` : "Not saved yet"}</span><button className="studio-primary-button" type="submit">Save</button></div></form></section>})}</div>
  </div>;
}
