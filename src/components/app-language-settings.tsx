import { saveAppLanguage } from '@/app/app/profile/language/actions';
import type { AppLanguage } from '@/lib/app-language';
export function AppLanguageSettings({ language, status }: { language: AppLanguage; status?: string }) {
  return <section className="t2i-language-settings" aria-label="App language">
    <div className="t2i-language-heading"><div><span className="app-overline">LANGUAGE / שפה / שפּראַך</span><h2>App language</h2><p>Choose the language used for app menus, buttons and settings. Your choice follows your account.</p></div></div>
    <form action={saveAppLanguage} className="t2i-language-form">
      <label htmlFor="t2i-language-select">Display language</label>
      <select name="language" id="t2i-language-select" defaultValue={language} dir="auto">
        <option value="en">English</option>
        <option value="he">עברית — Hebrew</option>
        <option value="yi">ייִדיש — Yiddish</option>
      </select>
      <button type="submit" className="app-primary-button">Save language</button>
    </form>
    {status === 'saved' && <p role="status" className="notice">Language preference saved to your account.</p>}
    {status === 'error' && <p role="alert" className="notice">Language could not be saved. Please try again.</p>}
    {status === 'invalid' && <p role="alert" className="notice">Choose one of the listed languages.</p>}
    <p className="t2i-language-note">Published episode names, descriptions, and video subtitles stay in their original language unless translated versions have been supplied.</p>
  </section>;
}
