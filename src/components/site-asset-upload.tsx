"use client";
import { useState } from "react";
/** Image uploads are handled on form Save by AdminUploadForm and stored in Supabase Storage. */
export function SiteAssetUpload({ fieldName = "logo_url", initialValue = "", label = "Logo or image" }: { fieldName?: string; initialValue?: string | null; label?: string }) {
 const [name, setName] = useState("");
 return <div className="studio-upload-field"><label>{label}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" data-save-upload="true" data-storage="brand" data-target-name={fieldName} onChange={e => setName(e.target.files?.[0]?.name || "")}/><small>Upload an image directly when you click Save (10 MB maximum).</small></label><label>Image URL or existing asset path<input name={fieldName} defaultValue={initialValue || ""} maxLength={1000}/></label><small role="status">{name ? `${name} selected; will upload on Save.` : "Current image stays until you choose a replacement."}</small>{initialValue && <img src={initialValue} alt="Current selected brand image" style={{maxWidth:190,maxHeight:94,objectFit:"contain",background:"white",borderRadius:12,padding:10}}/>}</div>;
}
