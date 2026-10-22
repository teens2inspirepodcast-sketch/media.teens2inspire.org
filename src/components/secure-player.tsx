"use client";
import { useState } from "react";
import { LockKeyhole, Play } from "lucide-react";

export function SecurePlayer({ contentId, poster, type }: { contentId: string; poster?: string | null; type?: string }) {
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
  return <section className="secure-player-shell" aria-label="Secure media player">
    {url ? (type === "podcast" ? <audio controls src={url} className="secure-audio" autoPlay /> : <video controls playsInline poster={poster || undefined} src={url} className="secure-video" autoPlay />) : <div className="secure-player-placeholder" style={poster ? { backgroundImage: `linear-gradient(0deg,rgba(30,8,20,.9),rgba(30,8,20,.18)),url("${poster}")` } : undefined}>
      <div className="secure-player-lock"><LockKeyhole size={17}/><span>SECURE PLAYBACK</span></div>
      <button className="secure-play-button" onClick={load} disabled={busy} aria-label={busy ? "Checking access" : "Play content"}><Play size={25} fill="currentColor"/></button>
      <div className="secure-player-copy"><span>TEENS2INSPIRE ORIGINALS</span><h2>{busy ? "Checking your access…" : "Ready when you are."}</h2><p>Playback is authorized securely before the media is delivered.</p></div>
      {message && <p className="secure-player-error" role="status">{message}</p>}
    </div>}
  </section>;
}
