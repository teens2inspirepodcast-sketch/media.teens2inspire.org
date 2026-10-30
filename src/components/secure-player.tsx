"use client";
import { Play, LockKeyhole } from "lucide-react";
import { usePersistentPlayer } from "@/components/persistent-media-player";

export function SecurePlayer({ contentId, title, poster, type }: { contentId: string; title: string; poster?: string | null; type?: string }) {
  const { playContent, loading, error, current, open } = usePersistentPlayer();
  const isCurrent = current?.id === contentId;
  return <section className="secure-player-shell t2i-streaming-play-prompt" aria-label="Secure media player">
    <div className="t2i-play-prompt-art" style={poster ? { backgroundImage: `linear-gradient(0deg,rgba(24,8,20,.52),rgba(24,8,20,.1)),url("${poster.replaceAll('"', '%22')}")` } : undefined}>
      <span className="t2i-player-auth-label"><LockKeyhole size={13}/> SECURE MEMBERSHIP PLAYBACK</span>
      <button className="t2i-big-play-button" type="button" disabled={loading} aria-label={isCurrent ? "Open current player" : `Play ${title}`} onClick={() => isCurrent && !error ? open() : void playContent({ id: contentId, title, poster, type: type || "video" })}><Play size={32} fill="currentColor"/></button>
      <span className="t2i-prompt-hint">{loading ? "Checking access…" : isCurrent ? "Continue in the player" : "Tap to play"}</span>
    </div>
    {isCurrent && error && <p className="secure-player-error" role="status">{error}</p>}
  </section>;
}
