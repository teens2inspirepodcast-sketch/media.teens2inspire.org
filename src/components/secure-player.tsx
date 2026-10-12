"use client";
import { useState } from "react";

export function SecurePlayer({ contentId, poster }: { contentId: string; poster?: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/media/playback/${encodeURIComponent(contentId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Playback is unavailable.");
      if (typeof data.url !== "string" || !data.url.startsWith("https://")) throw new Error("The media provider returned an invalid playback URL.");
      setUrl(data.url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Playback is unavailable."); }
    finally { setBusy(false); }
  }
  return <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
    {url ? <video controls playsInline poster={poster || undefined} src={url} style={{ width: "100%", maxHeight: "70vh", background: "#241019" }} /> : <div style={{ padding: 30 }}><h3>Watch securely</h3><p>Playback uses an authenticated server endpoint so private media URLs are not embedded in the page.</p><button className="btn primary" onClick={load} disabled={busy}>{busy ? "Checking access…" : "Play episode"}</button>{message && <p className="notice" role="status">{message}</p>}</div>}
  </div>;
}
