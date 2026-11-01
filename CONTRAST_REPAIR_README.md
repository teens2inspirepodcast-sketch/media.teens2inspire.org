# Teens2Inspire Media: Mobile contrast and visual repair

Based on five iPhone screenshots of the live media app: family profile chooser, Explore homepage, saved Library, Events, and Settings.

## Diagnosed and corrected

- **Invisible logo:** the pink brand logo was sitting on a nearly identical bright-pink header. The header is now white with a restrained pink top accent; the original logo is unchanged and has sufficient contrast.
- **Invisible bottom icons:** legacy global CSS forced white SVG path strokes even though the new bar was white. The repair explicitly sets strokes on Lucide SVG child shapes to `currentColor`, not just the SVG parent.
- **Unreadable Settings links:** dark cards were inherited from older stylesheet rules while modern light-page rules applied dark text. Settings links and their parent layout now use light surfaces, deep-plum text and readable secondary copy.
- **Inconsistent color schemes:** the authenticated media app now uses a coherent white/soft-blush canvas, deep-plum headings, readable muted text, and rose accent buttons. Dark berry, photographic, and protected playback surfaces retain white/light-pink text.
- **Family profiles:** the picker has soft blush surroundings, distinct berry profile avatars, and dark text on the light layout.
- **Events, search, library and detail:** empty states, thumbnail badges, text links, player placeholders and input controls have targeted foreground/background contrast rules.
- **Navigation:** a readable five-tab bottom bar stays visible with a clear selected state; safe-area spacing is retained.

## Exact technical changes

- Added `src/app/visual-contrast-repair.css`, imported **last** in `src/app/layout.tsx` after existing `globals.css` and `streaming-refresh.css`.
- The repair is scoped to `.app-shell.t2i-light-streaming`, leaving the site, billing, Supabase and Stripe systems unchanged.
- No API routes, Edge Functions, credentials, database schema, payment or authorization logic modified.

## Verification and limitations

- Verified CSS syntax and checked representative iPhone-size browser previews with the actual stylesheets. Checked computed text, card, header and SVG stroke colors (including previously white SVG subpaths).
- Static browser previews are visual fixtures, not the authenticated live Next.js app. Full production build, authenticated end-to-end playback and actual-device review remain pending.
- Deploy the media-app ZIP only to the **media.teens2inspire.org** project. The separate marketing website is unchanged.
