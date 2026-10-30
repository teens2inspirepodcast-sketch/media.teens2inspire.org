'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { saveAppLanguage } from '@/app/app/profile/language/actions';
import type { AppLanguage } from '@/lib/app-language';
import { useAppTranslation } from '@/components/app-localization';

export function AppLanguageSettings({ language, status }: { language: AppLanguage; status?: string }) {
  const [selected, setSelected] = useState<AppLanguage>(language);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { t } = useAppTranslation();

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData();
    data.set('language', selected);
    startTransition(async () => {
      try {
        const result = await saveAppLanguage(data);
        if (!result.ok) {
          setError(result.error || 'save');
          return;
        }
        // A full navigation refreshes the preserved Next.js app layout as well as
        // the cookie-backed locale, so switching back to English always works.
        window.location.assign('/app/profile?language=saved');
      } catch {
        setError('save');
      }
    });
  }

  return <section className="t2i-language-settings" aria-label={t('App language')}>
    <div className="t2i-language-heading"><div><span className="app-overline">LANGUAGE / שפה / שפּראַך</span><h2>{t('App language')}</h2><p>{t('Choose the language used for app menus, buttons and settings. Your choice follows your account.')}</p></div></div>
    <form onSubmit={onSave} className="t2i-language-form">
      <label htmlFor="t2i-language-select">{t('Display language')}</label>
      <select name="language" id="t2i-language-select" value={selected} onChange={(event) => setSelected(event.target.value as AppLanguage)} dir="auto" disabled={pending}>
        <option value="en">English</option>
        <option value="he">עברית — Hebrew</option>
        <option value="yi">ייִדיש — Yiddish</option>
      </select>
      <button type="submit" className="app-primary-button" disabled={pending}>{pending ? 'Saving…' : t('Save language')}</button>
    </form>
    {status === 'saved' && <p role="status" className="notice">{t('Language preference saved to your account.')}</p>}
    {((error && error !== 'invalid') || status === 'error') && <p role="alert" className="notice">{t('Language could not be saved. Please try again.')}</p>}
    {(error === 'invalid' || status === 'invalid') && <p role="alert" className="notice">{t('Choose one of the listed languages.')}</p>}
    <p className="t2i-language-note">{t('Published episode names, descriptions, and video subtitles stay in their original language unless translated versions have been supplied.')}</p>
  </section>;
}
