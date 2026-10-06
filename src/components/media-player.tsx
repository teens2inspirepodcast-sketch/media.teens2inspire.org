"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  return `${mins}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function MediaPlayer({ contentId, src, kind, resumeAt = 0 }: {
  contentId: string;
  src: string;
  kind: "audio" | "video";
  resumeAt?: number;
}) {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const lastSave = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(resumeAt);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.82);
  const [error, setError] = useState(false);
  const isVideo = kind === "video";

  const saveProgress = useCallback((position: number, length: number) => {
    const now = Date.now();
    if (now - lastSave.current < 12000 && position !== 0) return;
    lastSave.current = now;
    void fetch("/api/media/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, positionSeconds: Math.floor(position), durationSeconds: Math.floor(length || 0) }),
      keepalive: true,
    });
  }, [contentId]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    media.volume = volume;
    if (resumeAt > 0 && Number.isFinite(resumeAt)) media.currentTime = resumeAt;
  }, [resumeAt, volume]);

  async function togglePlay() {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) {
      try { await media.play(); setError(false); }
      catch { setError(true); }
    } else {
      media.pause();
    }
  }

  function seek(value: number) {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = value;
    setTime(value);
    saveProgress(value, duration);
  }

  const controls = (
    <div className={`media-controls ${isVideo ? "media-controls-video" : ""}`}>
      <button type="button" className="player-toggle" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
        {playing ? <Pause size={18} fill="currentColor" aria-hidden="true" /> : <Play size={18} fill="currentColor" aria-hidden="true" />}
      </button>
      <span className="player-time">{clock(time)}</span>
      <label className="sr-only" htmlFor={`seek-${contentId}`}>Seek through media</label>
      <input id={`seek-${contentId}`} className="player-seek" type="range" min={0} max={duration || 1} step={1} value={Math.min(time, duration || 0)} onChange={(event) => seek(Number(event.target.value))} style={{ "--seek-progress": `${duration ? time / duration * 100 : 0}%` } as React.CSSProperties} />
      <span className="player-time">{clock(duration)}</span>
      <button type="button" className="volume-button" onClick={() => setVolume(volume > 0 ? 0 : 0.82)} aria-label={volume > 0 ? "Mute" : "Unmute"}>
        {volume > 0 ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
      </button>
      <label className="sr-only" htmlFor={`volume-${contentId}`}>Volume</label>
      <input id={`volume-${contentId}`} className="volume-range" type="range" min={0} max={1} step={0.02} value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
    </div>
  );

  return (
    <div className={`media-player media-player-${kind}`}>
      {isVideo ? (
        <div className="video-frame">
          <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={src} playsInline preload="metadata" onTimeUpdate={(event) => { const value = event.currentTarget.currentTime; setTime(value); if (Math.floor(value) % 12 === 0) saveProgress(value, duration); }} onDurationChange={(event) => setDuration(event.currentTarget.duration)} onLoadedMetadata={(event) => { setDuration(event.currentTarget.duration); if (resumeAt > 0) event.currentTarget.currentTime = resumeAt; }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); saveProgress(0, duration); }} onError={() => setError(true)} />
          {!playing && <button type="button" className="video-center-play" onClick={togglePlay} aria-label="Play video"><Play size={24} fill="currentColor" aria-hidden="true" /></button>}
          {controls}
        </div>
      ) : (
        <div className="audio-player">
          <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={src} preload="metadata" onTimeUpdate={(event) => { const value = event.currentTarget.currentTime; setTime(value); if (Math.floor(value) % 12 === 0) saveProgress(value, duration); }} onDurationChange={(event) => setDuration(event.currentTarget.duration)} onLoadedMetadata={(event) => { setDuration(event.currentTarget.duration); if (resumeAt > 0) event.currentTarget.currentTime = resumeAt; }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); saveProgress(0, duration); }} onError={() => setError(true)} />
          {controls}
        </div>
      )}
      {error && <p className="player-error" role="status">This media could not be played. Check your connection and try again.</p>}
    </div>
  );
}
