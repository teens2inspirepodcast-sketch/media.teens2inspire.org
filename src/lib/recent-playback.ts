import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveViewerProfileId } from '@/lib/viewer-profile';
import { localizeContentRows } from '@/lib/localized-content';
import type { AppLanguage } from '@/lib/app-language';

export type RecentPlayback = {
  id: string; title: string; description: string | null; type: string; cover_url: string | null;
  positionSeconds: number; durationSeconds: number; completed: boolean; updatedAt: string;
};

export async function getRecentPlayback(
  supabase: SupabaseClient,
  userId: string,
  profile: { membership_tier?: string | null; membership_status?: string | null } | null,
  language: AppLanguage,
  limit = 24,
): Promise<RecentPlayback[]> {
  const profileId = await resolveViewerProfileId(supabase, userId, profile);
  const { data: positions, error } = await supabase.from('media_playback_bookmarks')
    .select('content_id,position_seconds,duration_seconds,completed,updated_at')
    .eq('user_id', userId).eq('profile_id', profileId)
    .order('updated_at', { ascending: false }).limit(Math.min(500, Math.max(1, limit)));
  if (error || !positions?.length) return [];
  const ids = positions.map(row => row.content_id);
  const { data: content, error: contentError } = await supabase.from('content')
    .select('id,title,description,type,cover_url')
    .eq('status','published').in('type',['video','podcast']).in('id',ids);
  if (contentError || !content?.length) return [];
  const localized = await localizeContentRows(supabase, content, language);
  const items = new Map(localized.map(row => [row.id, row]));
  return positions.flatMap(row => {
    const item = items.get(row.content_id);
    return item ? [{ ...item, positionSeconds: Number(row.position_seconds || 0),
      durationSeconds: Number(row.duration_seconds || 0), completed: Boolean(row.completed), updatedAt: row.updated_at }] : [];
  });
}
