# Teens2Inspire — Recently Played and Continue Watching

The app now saves each account's and Family profile's hosted audio/video position in `public.media_playback_bookmarks`.

## Behavior
- On authenticated R2 playback, the current profile's saved position is retrieved before media starts.
- Playback progress updates approximately every 10 seconds, on pause, seek, finish, close, and when the tab is hidden.
- Recently Played appears in Library; Continue Watching & Listening appears on Explore.
- Partially played episodes reopen at their saved position. Completed items remain in Recently Played with a Replay label.
- Owner and Family profiles have different progress histories; membership and R2 authorization are unchanged. Removing a Family profile also deletes its saved playback positions.
- The API derives user/profile IDs from authenticated sessions and validated server cookies. No client-provided identity can scope a bookmark.
- Cross-origin RSS.com iframe playback cannot expose playback time to this app; progress syncing applies to content played with the in-app secure player.

## Supabase
The profile-aware table and RLS policies were installed on the existing project, and any legacy owner progress was imported if present. See included migration for reference. It should not be reapplied manually without checking migration history.

## Testing limits
The source passed TSX syntax checks and CSS parsing. The app has not yet passed a full Next.js build or live authenticated R2 playback test on iOS/Android. Test switching Family profiles, playing/pausing, resuming on another device, completed playback, and content access restrictions before production deployment.
