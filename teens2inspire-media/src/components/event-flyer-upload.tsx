"use client";
import { useRef, useState } from "react";
export function EventFlyerUpload({ name = "image_url", initialUrl = "" }: { name?: string; initialUrl?: string }) {
  const input = useRef<HTMLInputElement>(null); const [url, setUrl] = useState(initialUrl); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function upload() {
    const file = input.current?.files?.[0]; if (!file) { setMessage("Choose a flyer image first."); return; }
    setBusy(true); setMessage("Preparing secure upload…");
    try {
      const r = await fetch("/api/admin/events/flyer-upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error || "Could not prepare upload.");
      setMessage("Uploading flyer…"); const up = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!up.ok) throw new Error("R2 rejected the upload. Check the public bucket CORS policy.");
      setUrl(data.publicUrl); setMessage("Flyer uploaded. Save the event to attach it.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Upload failed."); } finally { setBusy(false); }
  }
  return <div className="wide" style={{ display: "grid", gap: 8 }}><label>Upload event flyer (PNG, JPG, WebP, AVIF; max 12 MB)<input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/avif" disabled={busy}/></label><div><button className="btn secondary" type="button" onClick={upload} disabled={busy}>{busy ? "Uploading…" : "Upload flyer"}</button></div>{message && <p className="notice" role="status">{message}</p>}<label>Flyer URL<input name={name} type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Upload a flyer or paste an HTTPS image URL"/></label></div>;
}
