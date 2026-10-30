import { cookies } from 'next/headers';

export type AppLanguage = 'en' | 'he' | 'yi';
export const LANGUAGE_COOKIE = 't2i-app-language';
export function normalizeLanguage(value: unknown): AppLanguage {
  return value === 'he' || value === 'yi' ? value : 'en';
}

/** Account preference wins across devices; the cookie is a safe fallback if the table is temporarily unavailable. */
export async function getAppLanguage(supabase: any, userId: string): Promise<AppLanguage> {
  const store = await cookies();
  const fallback = normalizeLanguage(store.get(LANGUAGE_COOKIE)?.value);
  if (!userId) return fallback;
  try {
    const { data, error } = await supabase.from('user_app_preferences').select('language').eq('user_id', userId).maybeSingle();
    return !error && data ? normalizeLanguage(data.language) : fallback;
  } catch { return fallback; }
}
