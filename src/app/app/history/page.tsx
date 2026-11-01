import Link from "next/link";
import { ArrowLeft, Headphones } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAppLanguage } from "@/lib/app-language";
import { getRecentPlayback } from "@/lib/recent-playback";
import { RecentlyPlayedShelf } from "@/components/recently-played-shelf";

export default async function PlaybackHistory() {
  const { supabase, user, profile } = await requireUser("/app/history");
  const language = await getAppLanguage(supabase, user!.id);
  const history = await getRecentPlayback(supabase, user!.id, profile, language, 500);
  return <main className="app-content app-page-content t2i-collections-page">
    <Link className="t2i-collection-back" href="/app"><ArrowLeft size={16}/> Back to home</Link>
    <div className="page-intro"><span className="app-overline">YOUR LISTENING HISTORY</span><h1>Recently played</h1><p>Return to the exact place you left off.</p></div>
    {history.length
      ? <RecentlyPlayedShelf items={history} title="Your listening & viewing history" showAll />
      : <div className="empty-state"><div className="empty-state-icon"><Headphones size={22}/></div><h2>Nothing played yet.</h2><p>Play an episode or video, and it will show up here.</p><Link href="/app/explore">Explore collections</Link></div>}
  </main>;
}
