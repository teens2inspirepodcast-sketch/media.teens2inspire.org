'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { LANGUAGE_COOKIE, normalizeLanguage } from '@/lib/app-language';

export async function saveAppLanguage(form: FormData) {
  const { user, supabase } = await requireUser('/app/profile');
  const raw = String(form.get('language') || '');
  if (!['en', 'he', 'yi'].includes(raw)) redirect('/app/profile?language=invalid');
  const language = normalizeLanguage(raw);
  const { error } = await supabase.from('user_app_preferences').upsert(
    { user_id: user!.id, language, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) redirect('/app/profile?language=error');
  (await cookies()).set(LANGUAGE_COOKIE, language, {
    path: '/', maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', httpOnly: true
  });
  revalidatePath('/app', 'layout');
  redirect('/app/profile?language=saved');
}
