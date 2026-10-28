"use client";
import { useRef, useState } from "react";

export function R2MediaUpload({ fieldName = "r2_media_key", artwork = false }: { fieldName?: string; artwork?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) { setMessage("Choose a file first."); return; }
    setBusy(true); setMessage("Preparing secure upload…"); setKey("");
    try {
      const response = await fetch("/api/admin/media/upload-url", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, artwork }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not prepare upload.");
      setMessage("Uploading to private R2 storage…");
      const uploaded = await fetch(data.uploadUrl, {
        method: "PUT", headers: { "Content-Type": file.type }, body: file,
      });
      if (!uploaded.ok) throw new Error("R2 rejected the upload. Check the bucket CORS settings and R2 permissions.");
      setKey(artwork ? `/api/media/artwork/${String(data.key).replace(/^artwork\//, "")}` : data.key);
      setMessage("Upload complete. The object key has been added to the content form.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Try again.");
    } finally { setBusy(false); }
  }

  return <div className="wide" style={{ display: "grid", gap: 10 }}>
    <label>{artwork ? "Upload cover artwork from your device" : "Upload a file to private Cloudflare R2"}
      <input ref={inputRef} type="file" accept={artwork ? "image/jpeg,image/png,image/webp,image/gif,image/avif" : "video/mp4,video/webm,video/quicktime,video/x-matroska,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac,application/pdf,image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"} disabled={busy} />
      <small>{artwork ? "Choose a JPG, PNG, WebP, GIF, or AVIF image. Maximum 20 MB." : "Maximum 500 MB. Supports audio, video, PDF, and common image files. Files stay in private R2 storage."}</small>
    </label>
    <div><button className="btn secondary" type="button" onClick={upload} disabled={busy}>{busy ? "Uploading…" : artwork ? "Upload cover image" : "Upload file to R2"}</button></div>
    {message && <p role="status" aria-live="polite" className="notice">{message}</p>}
    <label>{artwork ? "Uploaded cover image" : "R2 object key"}<input name={fieldName} value={key} onChange={event => setKey(event.target.value)} maxLength={1024} placeholder={artwork ? "Choose a cover image above" : "Upload a file above or enter an existing private object key"}/><small>{artwork ? "This uploaded image is saved with the content when you submit the form." : "Save the content after the upload completes. This key is used by the secure playback route."}</small></label>
  </div>;
}
