import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Only server-resolved, membership-owned Family profile IDs may scope playback history. */
export async function resolveViewerProfileId(
  supabase: SupabaseClient,
  userId: string,
  profile: { membership_tier?: string | null; membership_status?: string | null } | null,
): Promise<string> {
  if (profile?.membership_tier !== 'family' || profile?.membership_status !== 'active') return userId;
  const selected = (await cookies()).get('t2i-active-family-profile')?.value;
  if (!selected || selected === 'owner' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selected)) return userId;
  const { data, error } = await supabase.from('family_profiles').select('id').eq('id', selected).eq('owner_id', userId).maybeSingle();
  if (error || !data) return userId;
  return data.id;
}
