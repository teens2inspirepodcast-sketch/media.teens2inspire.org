# Family profile switching, avatar uploads, and mobile navigation

Implemented in this source package:

- Family members on an active Family membership can switch the active display profile from **Settings → Family profiles**. The account holder is also a selectable profile.
- The selected profile is stored in an HTTP-only, one-year cookie. The cookie only changes the displayed profile name/avatar; the authenticated account remains the membership owner and remains the only identity used for permissions and billing.
- Account holders can upload their own profile picture. They can also upload a picture for each additional family profile.
- Avatar files are private in Supabase Storage. Accepted types: JPEG, PNG, WebP, and AVIF. Maximum file size: 3 MB. The Next.js Server Action body limit is set to 4 MB so uploads fit. Signed URLs are used to display them.
- The migration adds the avatar fields, private `profile-avatars` bucket, owner-scoped storage policies, and guarded RPCs for saving avatar paths.
- Mobile bottom navigation uses a 64 px content height plus the device safe area, 22 px icons, 48 px minimum touch targets, readable labels, and a pink selected-state pill/indicator.
- The active navigation state tracks query-string content filters such as Listen, Watch, Read, and Printables.

## Database status

Migration `20261025052947_family_profile_switching_and_avatars.sql` is included in this package and was applied to the connected Supabase project on 2026-10-25. The private bucket, both avatar columns, and both avatar RPCs were verified after applying it.

## Release checks

After deploying the updated media app, test:

1. Switch between the account holder and each of the two additional family profiles; verify the header avatar/name and home greeting update.
2. Upload each accepted image type under 3 MB; verify it appears in the header and Settings.
3. Confirm oversized and unsupported files are rejected.
4. Verify a signed-out user cannot access private avatar objects and one account cannot upload to another account's path.
5. Verify the bottom bar on an iPhone with the home indicator and check all labels and selected states.

A complete Next.js production build was not run in this environment because dependencies are not installed and the earlier npm registry connection failed. The source files passed TypeScript transpilation/syntax parsing; run the repository's GitHub Actions checks before deploying.
