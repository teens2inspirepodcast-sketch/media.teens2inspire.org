import type { AppLanguage } from './app-language';

type LocalizedRow = { content_id: string; title: string; description: string | null; body: string | null };
/** No external translation service or user-content exfiltration. Supabase CMS translations are opt-in. */
export async function localizeContentRows<T extends { id: string; title: string; description?: string | null; body?: string | null }>(
  supabase: any, rows: T[], language: AppLanguage
): Promise<T[]> {
  if (language === 'en' || !rows.length) return rows;
  try {
    const { data, error } = await supabase.from('content_translations')
      .select('content_id,title,description,body').eq('language', language)
      .in('content_id', rows.map(row => row.id));
    if (error || !data) return rows;
    const lookup = new Map<string, LocalizedRow>((data as LocalizedRow[]).map(row => [row.content_id, row]));
    return rows.map(row => {
      const translation = lookup.get(row.id);
      return translation ? { ...row,
        title: translation.title || row.title,
        description: translation.description || row.description,
        ...(row.body !== undefined ? { body: translation.body || row.body } : {}),
      } as T : row;
    });
  } catch { return rows; }
}
