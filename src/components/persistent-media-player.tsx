'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Captions, ChevronDown, Headphones, Maximize2, Minimize2, Pause, Play, RotateCcw, RotateCw, X } from 'lucide-react';
import { useAppTranslation } from '@/components/app-localization';

type Track = { id: string; title: string; poster?: string | null; type: string; hasCaptions?: boolean; captionLanguage?: 'en' | 'he' | 'yi' };
type PlayerContextValue = { playContent: (item: Track) => Promise<void>; current: Track | null; loading: boolean; error: string; open: () => void };
const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePersistentPlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error('usePersistentPlayer must be used inside PersistentPlayerProvider');
  return value;
}
function timeLabel(time: number) {
  if (!Number.isFinite(time) || time < 0) return '0:00';
  const seconds = Math.floor(time);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
function isAudio(item: Track | null) { return item?.type === 'podcast'; }

export function PersistentPlayerProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const { t, language } = useAppTranslation();
  const [current, setCurrent] = useState<Track | null>(null);
  const [src, setSrc] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const videoStage = useRef<HTMLDivElement>(null);
  const pending = useRef(0);
  const lastPathname = useRef(pathname);
  const onContentPage = !!current && pathname === `/app/content/${current.id}`;
  const showFull = onContentPage || expanded;
  const activeElement = useCallback(() => isAudio(current) ? audio.current : video.current, [current?.type]);

  const playContent = useCallback(async (item: Track) => {
    if (current?.id === item.id && src) {
      setExpanded(true);
      try { await (isAudio(item) ? audio.current : video.current)?.play(); }
      catch { setError('Tap play to start playback.'); }
      return;
    }
    const request = ++pending.current;
    audio.current?.pause(); video.current?.pause();
    setPlaying(false); setElapsed(0); setDuration(0); setSrc(''); setError(''); setCaptionsOn(false);
    setLoading(true); setExpanded(true);
    try {
      // Always use the existing, membership-authorized R2 playback endpoint.
      const response = await fetch(`/api/media/playback/${encodeURIComponent(item.id)}`, { cache: 'no-store', credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Playback is unavailable.');
      if (typeof data.url !== 'string' || !data.url.startsWith('https://')) throw new Error('The media service returned an invalid playback URL.');
      if (request !== pending.current) return;
      setCurrent(item); setSrc(data.url);
    } catch (cause) {
      if (request !== pending.current) return;
      setCurrent(item); setError(cause instanceof Error ? cause.message : 'Playback is unavailable.');
    } finally {
      if (request === pending.current) setLoading(false);
    }
  }, [current?.id, src]);

  useEffect(() => {
    const element = activeElement();
    if (!src || !element) return;
    element.playbackRate = speed;
    element.play().catch(() => { setPlaying(false); setError('Tap play to start playback.'); });
    // A new authorized source should start once; changing playback speed does not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, current?.type]);

  // Navigating away automatically collapses the player. The same media element stays mounted.
  useEffect(() => {
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname;
      if (!onContentPage) setExpanded(false);
    }
  }, [pathname, onContentPage]);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement) || Boolean((video.current as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean } | null)?.webkitDisplayingFullscreen));
    };
    document.addEventListener('fullscreenchange', onChange);
    const el = video.current;
    el?.addEventListener('webkitbeginfullscreen', onChange);
    el?.addEventListener('webkitendfullscreen', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      el?.removeEventListener('webkitbeginfullscreen', onChange);
      el?.removeEventListener('webkitendfullscreen', onChange);
    };
  }, [current?.id]);

  useEffect(() => {
    const textTracks = video.current?.textTracks;
    if (!textTracks) return;
    for (let index = 0; index < textTracks.length; index++) textTracks[index].mode = captionsOn ? 'showing' : 'disabled';
  }, [captionsOn, current?.id, src]);

  useEffect(() => {
    document.body.classList.toggle('t2i-player-is-open', Boolean(current && showFull));
    return () => document.body.classList.remove('t2i-player-is-open');
  }, [current, showFull]);

  async function togglePlayback() {
    const element = activeElement();
    if (!element || !src) return;
    if (!element.paused) { element.pause(); return; }
    try { await element.play(); setError(''); }
    catch { setError('Playback was blocked. Tap play again.'); }
  }
  function skip(seconds: number) {
    const element = activeElement(); if (!element) return;
    const end = Number.isFinite(element.duration) ? element.duration : Infinity;
    element.currentTime = Math.max(0, Math.min(end, element.currentTime + seconds));
  }
  function close() {
    pending.current++;
    audio.current?.pause(); video.current?.pause();
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setCurrent(null); setSrc(''); setExpanded(false); setError(''); setPlaying(false);
    setLoading(false); setElapsed(0); setDuration(0); setCaptionsOn(false); setIsFullscreen(false);
  }
  async function toggleFullscreen() {
    const target = videoStage.current;
    if (!target || !video.current) return;
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      if (target.requestFullscreen) { await target.requestFullscreen(); return; }
      // iPhone Safari provides native video fullscreen through webkitEnterFullscreen.
      const nativeVideo = video.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
      if (typeof nativeVideo.webkitEnterFullscreen === 'function') nativeVideo.webkitEnterFullscreen();
      else setError('Fullscreen is not available on this browser.');
    } catch { setError('Fullscreen could not be opened on this device.'); }
  }
  const mediaEvents = {
    onTimeUpdate: (event: SyntheticEvent<HTMLMediaElement>) => setElapsed(event.currentTarget.currentTime),
    onDurationChange: (event: SyntheticEvent<HTMLMediaElement>) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0),
    onPlay: () => setPlaying(true), onPause: () => setPlaying(false), onEnded: () => setPlaying(false),
    onError: () => setError('This media could not be played. Please try again.'),
  };
  const isVideo = current && !isAudio(current);

  return <PlayerContext.Provider value={{ playContent, current, loading, error, open: () => setExpanded(true) }}>
    {children}
    {current && <div className={`t2i-persistent-player ${onContentPage ? 'is-page' : expanded ? 'is-expanded' : 'is-mini'} ${isVideo ? 'is-video' : 'is-audio'}`} role="region" aria-label={t('Video playback')} dir={language === 'en' ? 'ltr' : 'rtl'}>
      {expanded && !onContentPage && <div className="t2i-player-backdrop" aria-hidden="true" onClick={() => setExpanded(false)}/>}
      <div className="t2i-player-frame">
        {showFull && <div className="t2i-player-topline">
          {onContentPage ? <Link href="/app/explore" className="t2i-player-return"><ArrowLeft size={20}/>{t('Back to explore')}</Link> : <span>{t(isAudio(current) ? 'NOW LISTENING' : 'NOW WATCHING')}</span>}
          <div className="t2i-player-top-actions">
            {!onContentPage && <button type="button" onClick={() => setExpanded(false)} aria-label={t('Minimize')}><ChevronDown size={21}/></button>}
            <button type="button" onClick={close} aria-label={t('Close')}><X size={20}/></button>
          </div>
        </div>}

        {/* This video node never unmounts on navigation: it becomes the mini-player. */}
        {isVideo && <div className="t2i-watch-video-stage" ref={videoStage}>
          <video ref={video} src={src || undefined} poster={current.poster || undefined} preload="metadata" playsInline {...mediaEvents} className="t2i-video-playback" aria-label={current.title}>
            {current.hasCaptions && <track key={`${current.id}-${current.captionLanguage || 'en'}`} kind="subtitles" src={`/api/media/captions/${encodeURIComponent(current.id)}`} srcLang={current.captionLanguage || 'en'} label={current.captionLanguage === 'he' ? 'עברית' : current.captionLanguage === 'yi' ? 'ייִדיש' : 'English'} onLoad={() => { if (captionsOn && video.current?.textTracks[0]) video.current.textTracks[0].mode = 'showing'; }} />}
          </video>
          {showFull && <button type="button" className="t2i-video-stage-play" onClick={togglePlayback} disabled={!src || loading} aria-label={t(playing ? 'Pause' : 'Play')}>
            {playing ? <Pause size={24} fill="currentColor"/> : <Play size={26} fill="currentColor"/>}
          </button>}
          {showFull && <button type="button" className="t2i-video-stage-fullscreen" onClick={toggleFullscreen} title={t(isFullscreen ? 'Exit fullscreen' : 'Fullscreen')} aria-label={t(isFullscreen ? 'Exit fullscreen' : 'Fullscreen')}><Maximize2 size={20}/></button>}
        </div>}
        {!isVideo && <audio ref={audio} src={src || undefined} preload="metadata" {...mediaEvents} className="t2i-hidden-playback"/>}

        {(!isVideo || !showFull) && <button type="button" className="t2i-player-art-button" onClick={() => setExpanded(true)} aria-label={t('Play')}>
          {current.poster ? <img src={current.poster} alt=""/> : <span className="t2i-player-art-fallback"><Headphones size={28}/></span>}
        </button>}
        <div className="t2i-player-title"><strong data-no-translate>{current.title}</strong><span>Teens2Inspire · {t(isAudio(current) ? 'Audio' : 'Video')}</span></div>
        <div className="t2i-player-controls">
          {showFull && <button type="button" onClick={() => skip(-15)} aria-label={t('Back 15 seconds')} disabled={!src}><RotateCcw size={22}/><small>15</small></button>}
          <button className="t2i-player-primary-control" type="button" onClick={togglePlayback} disabled={!src || loading} aria-label={t(playing ? 'Pause' : 'Play')}>{playing ? <Pause fill="currentColor" size={23}/> : <Play fill="currentColor" size={23}/>}</button>
          {showFull && <button type="button" onClick={() => skip(15)} aria-label={t('Forward 15 seconds')} disabled={!src}><RotateCw size={22}/><small>15</small></button>}
        </div>
        {!showFull && <div className="t2i-mini-actions"><button type="button" onClick={() => setExpanded(true)} aria-label={t('Fullscreen')}><Maximize2 size={18}/></button><button type="button" onClick={close} aria-label={t('Close')}><X size={19}/></button></div>}
        {showFull && <div className="t2i-player-expanded-body">
          <div className="t2i-player-timeline" dir="ltr"><span>{timeLabel(elapsed)}</span><input aria-label={t('Playback position')} type="range" min={0} max={duration > 0 ? duration : 1} step={0.1} value={Math.min(elapsed, duration || 1)} disabled={!duration} onChange={event => { const el = activeElement(); if (el) el.currentTime = Number(event.target.value); }}/><span>{timeLabel(duration)}</span></div>
          <div className="t2i-player-bottom-controls">
            <label>{t('Speed')} <select value={speed} onChange={event => { const rate = Number(event.target.value); setSpeed(rate); const el = activeElement(); if (el) el.playbackRate = rate; }}><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label>
            {isVideo && <button type="button" disabled={!current.hasCaptions} className={captionsOn ? 'is-active' : ''} onClick={() => setCaptionsOn(on => !on)} title={current.hasCaptions ? t(captionsOn ? 'Captions on' : 'Captions off') : t('Captions unavailable')} aria-label={current.hasCaptions ? t('Captions') : t('Captions unavailable')}><Captions size={19}/>{t('Captions')}{!current.hasCaptions && <small>—</small>}</button>}
            {isVideo && <button type="button" onClick={toggleFullscreen}><Maximize2 size={17}/>{t(isFullscreen ? 'Exit fullscreen' : 'Fullscreen')}</button>}
            {!onContentPage && <button type="button" onClick={() => setExpanded(false)}><Minimize2 size={17}/>{t('Minimize')}</button>}
          </div>
        </div>}
        {error && <p className="t2i-player-error" role="status">{error}</p>}
        {loading && <p className="t2i-player-loading" role="status">{t('Checking membership access…')}</p>}
      </div>
    </div>}
  </PlayerContext.Provider>;
}
