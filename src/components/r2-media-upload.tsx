"use client";

import { useState } from "react";

const MEDIA_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-matroska,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac,application/pdf,image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/** Must live inside AdminUploadForm: picking a file does not upload until Save is pressed. */
export function R2MediaUpload({ fieldName = "r2_media_key", artwork = false, defaultValue = "" }: { fieldName?: string; artwork?: boolean; defaultValue?: string | null }) {
  const [selected, setSelected] = useState("");
  return <div className="studio-upload-field">
    <label>{artwork ? "Cover artwork" : "Audio, video or document"}
      <input type="file" accept={artwork ? IMAGE_ACCEPT : MEDIA_ACCEPT} data-save-upload="true" data-storage={artwork ? "brand" : "r2"} data-target-name={fieldName} data-artwork={String(artwork)} onChange={e => setSelected(e.target.files?.[0]?.name || "")} />
      <small>{artwork ? "Select an image (up to 10 MB). Artwork is stored in public Supabase Storage; media is kept private in R2." : "Select a file (up to 500 MB)."} Just click Save; no separate upload button is needed.</small>
    </label>
    <label>{artwork ? "Saved cover image" : "Saved private media key"}<input name={fieldName} defaultValue={defaultValue || ""} maxLength={1024} placeholder={artwork ? "Saved automatically when you click Save" : "R2 key is filled automatically on Save"}/></label>
    <small role="status">{selected ? `Selected: ${selected}. Click Save once to upload to R2 and save your content.` : (defaultValue ? "Current file is kept unless you select a replacement." : "No file selected. Choose a file or use an existing key/URL.")}</small>
  </div>;
}
