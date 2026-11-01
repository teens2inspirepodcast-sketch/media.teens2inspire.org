import Link from "next/link";
import { ArrowLeft, ExternalLink, Megaphone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { readSitePopup, defaultPopup, getPopupMediaUrl } from "@/lib/site-popup";
import { SitePopupEditor } from "@/components/site-popup-editor";

export const dynamic = "force-dynamic";
type Search = Promise<{notice?:string}>;
export default async function ManagePopup({searchParams}: {searchParams:Search}) {
  await requireAdmin();
  const popup = await readSitePopup();
  const params = await searchParams;
  const initialMediaUrl = await getPopupMediaUrl(popup?.media_path);
  return <main className="popup-admin-shell"><div className="popup-admin-header"><Link href="/admin" className="popup-back"><ArrowLeft size={17}/> Admin dashboard</Link><Link href="/" className="popup-visit">View website <ExternalLink size={15}/></Link></div>
    <div className="popup-admin-heading"><div className="popup-admin-eyebrow"><Megaphone size={15}/> WEBSITE EXPERIENCE / CONTENT CONTROL</div><h1>Promotional <em>pop-up.</em></h1><p>Create a launch announcement, feature a new film, or promote something important—without changing your website code.</p></div>
    {params.notice && <p className="admin-notice" role="status">{params.notice}</p>}
    {!popup && <p className="admin-alert" role="alert">The pop-up database table is not available yet. Apply the included Supabase migration <code>20261028010000_site_popup_cms.sql</code> before saving or uploading.</p>}
    <SitePopupEditor initial={popup || defaultPopup} initialMediaUrl={initialMediaUrl}/>
  </main>;
}
