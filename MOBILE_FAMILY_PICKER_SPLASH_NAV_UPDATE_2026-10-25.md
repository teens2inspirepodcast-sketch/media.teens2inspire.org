# Teens2Inspire media app — mobile and family profile update

## Included
- Branded startup splash overlay stays visible for 10 seconds on the initial app load.
- Active Family memberships see a Netflix-inspired “Who’s watching today?” profile picker on the home screen and in Settings.
- The picker shows the account holder and any created family profiles, with an “Add a profile” tile while capacity remains.
- Family membership remains limited to three profiles total: the account holder plus up to two additional profiles.
- Existing profile switching, private avatar uploads, and profile management remain available.
- Mobile bottom navigation is slightly taller, with larger 27px icons and 11px labels while preserving the dark background, pink active highlight, and safe-area inset.

## Sizing reference
The bottom-navigation items have touch areas taller than the 44pt iOS / 48dp Android recommended minimums. Google's guidance recommends at least 48dp touch targets; Apple's tab-bar guidance recommends clear labels and a limited set of top-level tabs.

## Checks
- 58 TypeScript/TSX files passed a TypeScript transpilation syntax check with zero syntax errors.
- This was not a full `tsc --noEmit` or Next.js production build. Dependency installation and end-to-end browser/iPhone testing remain outstanding.
- No GitHub commit or Vercel deployment was made by this update.
