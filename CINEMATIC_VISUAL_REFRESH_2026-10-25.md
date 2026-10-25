# Teens2Inspire Media cinematic visual refresh

## Changes
- Swapped the header and 10-second startup splash to the square media app icon (`/icon-512.png`) instead of the main site wordmark.
- Added a dedicated full-screen family profile chooser at `/app/profiles`, shown on the first `/app` entry for active Family accounts in a browser session until a profile is selected.
- Added a separate, designed profile creation page at `/app/profiles/add` with clear fields and a return link.
- Removed the profile picker snippet from the media home page; it returns to the content-first home after profile selection.
- Updated media app surfaces to a high-contrast cinematic dark-plum palette and enlarged the mobile bottom navigation to about 92px plus the device safe area, with 30px icons, clearer labels, and the existing pink active highlight.

## Notes
- Existing profile switching and avatar upload actions are retained.
- This ZIP is source only. It has not been deployed to Vercel. Validate family profile creation, selection, and navigation in the deployed app before considering it production-ready.
