export function ContentLanguageEditor({ translations = [] }: { translations?: Array<{language:string;title:string;description:string|null;body:string|null}> }) {
  return <section className="studio-form-section" aria-label="Translated content"><h2>Translations / תרגומים / איבערזעצונגען</h2>
    <p>Optional. Add translated titles, descriptions and text for readers who select Hebrew or Yiddish. English originals remain unchanged. Leave a title blank to use the English original.</p>
    <div className="studio-form-grid">
    {(['he','yi'] as const).map(lang => {
      const existing = translations.find(item => item.language === lang);
      return <div className="studio-field-wide t2i-translation-editor" key={lang} dir="rtl" lang={lang}>
        <h3>{lang === 'he' ? 'עברית — Hebrew' : 'ייִדיש — Yiddish'}</h3>
        <label>{lang === 'he' ? 'כותרת' : 'טיטל'}<input name={`translated_title_${lang}`} maxLength={140} defaultValue={existing?.title || ''} placeholder={lang === 'he' ? 'כותרת מתורגמת' : 'איבערגעזעצטער טיטל'}/></label>
        <label>{lang === 'he' ? 'תיאור' : 'באַשרײַבונג'}<textarea name={`translated_description_${lang}`} rows={3} maxLength={5000} defaultValue={existing?.description || ''}/></label>
        <label>{lang === 'he' ? 'תוכן המאמר' : 'אַרטיקל־טעקסט'}<textarea name={`translated_body_${lang}`} rows={5} maxLength={30000} defaultValue={existing?.body || ''}/></label>
      </div>;
    })}
    </div>
  </section>;
}
