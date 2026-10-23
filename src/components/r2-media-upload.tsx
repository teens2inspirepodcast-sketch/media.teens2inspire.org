"use client";
import { useRef, useState } from "react";

export function R2MediaUpload() {
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
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not prepare upload.");
      setMessage("Uploading to private R2 storage…");
      const uploaded = await fetch(data.uploadUrl, {
        method: "PUT", headers: { "Content-Type": file.type }, body: file,
      });
      if (!uploaded.ok) throw new Error("R2 rejected the upload. Check the bucket CORS settings and R2 permissions.");
      setKey(data.key);
      setMessage("Upload complete. The object key has been added to the content form.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Try again.");
    } finally { setBusy(false); }
  }

  return <div className="wide" style={{ display: "grid", gap: 10 }}>
    <label>Upload a file to private Cloudflare R2
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,application/pdf,image/jpeg,image/png,image/webp" disabled={busy} />
      <small>Maximum 500 MB. Supports audio, video, PDF, and common image files. Files stay in private R2 storage.</small>
    </label>
    <div><button className="btn secondary" type="button" onClick={upload} disabled={busy}>{busy ? "Uploading…" : "Upload file to R2"}</button></div>
    {message && <p role="status" aria-live="polite" className="notice">{message}</p>}
    <label>R2 object key<input name="r2_media_key" value={key} onChange={event => setKey(event.target.value)} maxLength={1024} placeholder="Upload a file above or enter an existing private object key"/><small>Save the content after the upload completes. This key is used by the secure playback route.</small></label>
  </div>;
}
