'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { AppLanguage } from '@/lib/app-language';
import { translateUI } from '@/lib/app-translations';

const LanguageContext = createContext<AppLanguage>('en');
export function useAppTranslation() {
  const language = useContext(LanguageContext);
  return { language, t: (english: string) => translateUI(language, english) };
}

/**
 * Preserve the original English for every translated DOM node and attribute.
 * This is essential: replacing English with Hebrew/Yiddish without remembering
 * the original makes later language switches unable to restore English.
 */
export function AppLocalization({ language, children }: { language: AppLanguage; children: ReactNode }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.app-shell');
    if (!root) return;
    const documentRoot = document.documentElement;
    const originalDocumentLanguage = documentRoot.lang;
    const originalDocumentDirection = documentRoot.dir;
    documentRoot.lang = language;
    documentRoot.dir = language === 'en' ? 'ltr' : 'rtl';
    root.lang = language;
    root.dir = language === 'en' ? 'ltr' : 'rtl';
    const originals = new WeakMap<Text, { english: string; shown: string }>();
    const attributeOriginals = new WeakMap<Element, Map<string, { english: string; shown: string }>>();
    let frame = 0;
    let updating = false;

    function sync() {
      if (!root || updating) return;
      updating = true;
      try {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const textNode = node as Text;
          const parent = textNode.parentElement;
          if (!parent || parent.closest('script,style,code,pre,textarea,svg,select,option,[contenteditable="true"],[data-no-translate]')) continue;
          const current = textNode.nodeValue || '';
          const prior = originals.get(textNode);
          const english = prior && current === prior.shown ? prior.english : current;
          const trimmed = english.trim();
          const next = trimmed ? english.replace(trimmed, translateUI(language, trimmed)) : english;
          originals.set(textNode, { english, shown: next });
          if (current !== next) textNode.nodeValue = next;
        }
        root.querySelectorAll<HTMLElement>('[aria-label],[title],input[placeholder],textarea[placeholder]').forEach((element) => {
          if (element.closest('[data-no-translate]')) return;
          const records = attributeOriginals.get(element) || new Map();
          for (const key of ['aria-label', 'title', 'placeholder']) {
            const current = element.getAttribute(key);
            if (current === null) continue;
            const prior = records.get(key);
            const english = prior && current === prior.shown ? prior.english : current;
            const next = translateUI(language, english);
            records.set(key, { english, shown: next });
            if (next !== current) element.setAttribute(key, next);
          }
          attributeOriginals.set(element, records);
        });
      } finally {
        updating = false;
      }
    }
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    });
    sync();
    observer.observe(root, { childList: true, characterData: true, attributes: true, attributeFilter: ['title','placeholder','aria-label'], subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      // During client-side transitions, restore English before translating again.
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const record = originals.get(textNode);
        if (record && textNode.nodeValue === record.shown) textNode.nodeValue = record.english;
      }
      root.querySelectorAll<HTMLElement>('[aria-label],[title],input[placeholder],textarea[placeholder]').forEach(element => {
        const attributes = attributeOriginals.get(element);
        if (!attributes) return;
        for (const [key, record] of attributes) {
          if (element.getAttribute(key) === record.shown) element.setAttribute(key, record.english);
        }
      });
      root.removeAttribute('lang');
      root.removeAttribute('dir');
      documentRoot.lang = originalDocumentLanguage;
      documentRoot.dir = originalDocumentDirection;
    };
  }, [language]);
  const context = useMemo(() => language, [language]);
  return <LanguageContext.Provider value={context}>{children}</LanguageContext.Provider>;
}
