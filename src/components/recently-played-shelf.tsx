import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Headphones, Play } from 'lucide-react';
import type { RecentPlayback } from '@/lib/recent-playback';

function formatSeconds(seconds: number) {
  const time = Math.floor(Math.max(0, Number(seconds) || 0));
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2,'0')}`;
}

export function RecentlyPlayedShelf({ items, title = 'Continue watching & listening', showAll = false }: { items: RecentPlayback[]; title?: string; showAll?: boolean }) {
  if (!items.length) return null;
  return <section className="app-shelf t2i-recent-shelf" aria-label={title}>
    <div className="shelf-heading">
      <div><h2>{title}</h2><p>Pick up right where you left off, on any device.</p></div>
      {!showAll && <Link href="/app/history">See more <ArrowRight size={16}/></Link>}
    </div>
    <div className="t2i-recent-row">
      {(showAll ? items : items.slice(0, 12)).map(item => {
        const progress = item.durationSeconds > 0 ? Math.max(0,Math.min(100,(item.positionSeconds / item.durationSeconds)*100)) : 0;
        return <Link key={item.id} href={`/app/content/${item.id}`} className="t2i-recent-card" aria-label={`${item.completed ? 'Replay' : 'Continue'} ${item.title}`}>
          <div className="t2i-recent-art" style={item.cover_url ? { backgroundImage: `url("${item.cover_url.replaceAll('"','%22')}")` } : undefined}>
            {!item.cover_url && <Image src="/teens2inspire-logo.png" alt="" width={180} height={60} className="t2i-recent-fallback"/>}
            <span className="t2i-recent-play-icon">{item.type === 'podcast' ? <Headphones size={21}/> : <Play size={21} fill="currentColor"/>}</span>
            {item.durationSeconds > 0 && <span className="t2i-recent-progress" role="meter" aria-label="Playback progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }}/></span>}
          </div>
          <div className="t2i-recent-copy">
            <strong data-no-translate>{item.title}</strong>
            <span>{item.completed ? 'Finished · Replay' : `Resume at ${formatSeconds(item.positionSeconds)}`}</span>
          </div>
        </Link>;
      })}
    </div>
  </section>;
}
