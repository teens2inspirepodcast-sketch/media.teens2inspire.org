'use client';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { AppLanguage } from '@/lib/app-language';
import { translateUI } from '@/lib/app-translations';

const LanguageContext = createContext<AppLanguage>('en');
export function useAppTranslation() {
  const language = useContext(LanguageContext);
  return { language, t: (english: string) => translateUI(language, english) };
}

/** Localizes first-party static interface text on both server-rendered and client-rendered app routes. */
export function AppLocalization({ language, children }: { language: AppLanguage; children: ReactNode }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.app-shell');
    if (!root) return;
    root.setAttribute('lang', language);
    root.setAttribute('dir', language === 'en' ? 'ltr' : 'rtl');
    if (language === 'en') return;
    const translateText = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return value;
      const translated = translateUI(language, trimmed);
      return translated === trimmed ? value : value.replace(trimmed, translated);
    };
    let raf = 0;
    function update() {
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || parent.closest('script,style,code,pre,textarea,svg,[contenteditable="true"],[data-no-translate]')) continue;
        const original = node.nodeValue || '';
        const next = translateText(original);
        if (next !== original) node.nodeValue = next;
      }
      root.querySelectorAll<HTMLElement>('[aria-label],[title],input[placeholder],textarea[placeholder]').forEach((element) => {
        for (const attribute of ['aria-label', 'title', 'placeholder']) {
          const original = element.getAttribute(attribute);
          if (original) {
            const next = translateUI(language, original);
            if (next !== original) element.setAttribute(attribute, next);
          }
        }
      });
    }
    const observer = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); });
    update();
    observer.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); cancelAnimationFrame(raf); root.removeAttribute('dir'); root.removeAttribute('lang'); };
  }, [language]);
  const context = useMemo(() => language, [language]);
  return <LanguageContext.Provider value={context}>{children}</LanguageContext.Provider>;
}
