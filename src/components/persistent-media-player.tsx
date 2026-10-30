"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { ChevronDown, Headphones, Maximize2, Minimize2, Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";

type Track = { id: string; title: string; poster?: string | null; type: string };
type PlayerContextValue = { playContent: (item: Track) => Promise<void>; current: Track | null; loading: boolean; error: string; open: () => void };
const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePersistentPlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePersistentPlayer must be used inside PersistentPlayerProvider");
  return value;
}

function timeLabel(time: number) {
  if (!Number.isFinite(time) || time < 0) return "0:00";
  const seconds = Math.floor(time);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PersistentPlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const [src, setSrc] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audio = useRef<HTMLAudioElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const pending = useRef(0);
  const activeElement = useCallback(() => current?.type === "podcast" ? audio.current : video.current, [current?.type]);

  const playContent = useCallback(async (item: Track) => {
    if (current?.id === item.id && src) {
      setExpanded(true);
      try { await (item.type === "podcast" ? audio.current : video.current)?.play(); }
      catch { setError("Tap play to start this item."); }
      return;
    }
    const request = ++pending.current;
    audio.current?.pause(); video.current?.pause();
    setPlaying(false); setElapsed(0); setDuration(0); setSrc(""); setError("");
    setLoading(true); setExpanded(true);
    try {
      // Authorization stays on the existing server endpoint; no R2 URL is persisted.
      const response = await fetch(`/api/media/playback/${encodeURIComponent(item.id)}`, { cache: "no-store", credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Playback is unavailable.");
      if (typeof data.url !== "string" || !data.url.startsWith("https://")) throw new Error("The media provider returned an invalid playback URL.");
      if (request !== pending.current) return;
      setCurrent(item); setSrc(data.url);
    } catch (e) {
      if (request !== pending.current) return;
      setCurrent(item); setError(e instanceof Error ? e.message : "Playback is unavailable.");
    } finally { if (request === pending.current) setLoading(false); }
  }, [current?.id, src]);

  useEffect(() => {
    const element = activeElement();
    if (!src || !element) return;
    element.playbackRate = speed;
    element.play().catch(() => { setPlaying(false); setError("Tap play to start playback."); });
  }, [src, current?.type, activeElement, speed]);

  useEffect(() => {
    document.body.classList.toggle("t2i-player-is-open", expanded && !!current);
    return () => document.body.classList.remove("t2i-player-is-open");
  }, [expanded, current]);

  const toggle = async () => {
    const element = activeElement();
    if (!element || !src) return;
    if (!element.paused) { element.pause(); return; }
    try { await element.play(); setError(""); }
    catch { setError("Playback was blocked. Tap play again."); }
  };
  const skip = (seconds: number) => {
    const element = activeElement(); if (!element) return;
    const end = Number.isFinite(element.duration) ? element.duration : Infinity;
    element.currentTime = Math.max(0, Math.min(end, element.currentTime + seconds));
  };
  const close = () => {
    pending.current++;
    audio.current?.pause(); video.current?.pause();
    setCurrent(null); setSrc(""); setExpanded(false); setError(""); setPlaying(false);
    setLoading(false); setElapsed(0); setDuration(0);
  };
  const mediaEvents = {
    onTimeUpdate: (e: SyntheticEvent<HTMLMediaElement>) => setElapsed(e.currentTarget.currentTime),
    onDurationChange: (e: SyntheticEvent<HTMLMediaElement>) => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0),
    onPlay: () => setPlaying(true), onPause: () => setPlaying(false), onEnded: () => setPlaying(false),
    onError: () => setError("This media could not be played. Please try again."),
  };

  return <PlayerContext.Provider value={{ playContent, current, loading, error, open: () => setExpanded(true) }}>
    {children}
    {current && <div className={`t2i-persistent-player ${expanded ? "is-expanded" : "is-mini"}`} role="region" aria-label="Persistent media player">
      {expanded && <div className="t2i-player-backdrop" onClick={() => setExpanded(false)} aria-hidden="true" />}
      <div className="t2i-player-frame">
        {expanded && <div className="t2i-player-topline"><span>NOW {current.type === "podcast" ? "LISTENING" : "WATCHING"}</span><button type="button" onClick={() => setExpanded(false)} aria-label="Minimize player"><ChevronDown size={22}/></button></div>}
        <button type="button" className="t2i-player-art-button" onClick={() => setExpanded(true)} aria-label="Open full player">
          {current.poster ? <img src={current.poster} alt="" /> : <span className="t2i-player-art-fallback"><Headphones size={28}/></span>}
        </button>
        <div className="t2i-player-title"><strong>{current.title}</strong><span>Teens2Inspire · {current.type === "podcast" ? "Audio" : "Video"}</span></div>
        <div className="t2i-player-controls">
          {expanded && <button type="button" onClick={() => skip(-15)} aria-label="Back 15 seconds" disabled={!src}><RotateCcw size={21}/><small>15</small></button>}
          <button className="t2i-player-primary-control" type="button" onClick={toggle} disabled={!src || loading} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause fill="currentColor" size={23}/> : <Play fill="currentColor" size={23}/>}</button>
          {expanded && <button type="button" onClick={() => skip(15)} aria-label="Forward 15 seconds" disabled={!src}><RotateCw size={21}/><small>15</small></button>}
        </div>
        {!expanded && <div className="t2i-mini-actions"><button onClick={() => setExpanded(true)} aria-label="Expand player"><Maximize2 size={18}/></button><button onClick={close} aria-label="Close player"><X size={19}/></button></div>}
        {expanded && <div className="t2i-player-expanded-body">
          {current.type === "video" && <div className="t2i-player-video-caption">Video playback</div>}
          <div className="t2i-player-timeline"><span>{timeLabel(elapsed)}</span><input aria-label="Playback position" type="range" min={0} max={duration > 0 ? duration : 1} step={0.1} value={Math.min(elapsed, duration || 1)} disabled={!duration} onChange={e => { const el = activeElement(); if (el) el.currentTime = Number(e.target.value); }} /><span>{timeLabel(duration)}</span></div>
          <div className="t2i-player-bottom-controls"><label>Speed <select value={speed} onChange={e => { const rate = Number(e.target.value); setSpeed(rate); const el = activeElement(); if (el) el.playbackRate = rate; }}><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label><button type="button" onClick={() => setExpanded(false)}><Minimize2 size={16}/> Minimize</button><button type="button" onClick={close}><X size={16}/> Close</button></div>
        </div>}
        {error && <p className="t2i-player-error" role="status">{error}</p>}
        {loading && <p className="t2i-player-loading" role="status">Checking membership access…</p>}
        <audio ref={audio} src={current.type === "podcast" ? src : undefined} preload="metadata" {...mediaEvents} className="t2i-hidden-playback" />
        <video ref={video} src={current.type === "podcast" ? undefined : src} playsInline preload="metadata" poster={current.poster || undefined} {...mediaEvents} className={`t2i-video-playback ${expanded && current.type !== "podcast" ? "is-visible" : ""}`} />
      </div>
    </div>}
  </PlayerContext.Provider>;
}
