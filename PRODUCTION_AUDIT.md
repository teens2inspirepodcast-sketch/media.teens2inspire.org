# Teens2Inspire production audit

**Review date:** September 27, 2026  
**Result:** Code and database hardening completed, but this is **not cleared for paid public launch yet**. The production build succeeds. Stripe and Cloudflare R2 are not configured in the local environment, so live membership, payment, upload, and protected playback flows could not be exercised end to end. Read the manual launch requirements below before inviting the public.

## 1. Scope and architecture

Inspected the existing Next.js App Router application, Supabase server/browser clients, authentication/session handling, profile and membership routes, Stripe checkout/webhook/portal, R2 upload/streaming helpers, content APIs and detail pages, global header/footer, owner dashboard, migrations, and Vercel deployment configuration. The existing application and data model were extended; no production content rows or storage objects were deleted or replaced.

The app remains Next.js + Supabase Auth/Postgres/Storage + Stripe, with Cloudflare R2 as the planned content origin. `/dashboard` remains the owner-only Teens2Inspire Studio. R2 files use private object references; Supabase keeps content metadata and user/account data.

## 2. Public visual experience

- Kept one shared, authentication-aware `SiteHeader` and global footer.
- Updated the homepage to read featured content and shelves from published Supabase rows, and added database-driven homepage sections.
- Added compact single-line card previews with a `See more` link to the full content page. Full descriptions remain available on detail pages.
- Added dynamic `/sections/[slug]` pages, compact media cards, membership lock indicators, event previews, and reduced-motion styling.
- Added a Refunds page that says the owner has not set a refund policy yet rather than inventing one.
- Cards and sections use real records and designed empty states; no sample episodes or statistics were added.

## 3. Studio and content management

- `/dashboard` checks the signed-in Supabase user and the server-read `profiles.role` before rendering owner tools. Content, section, school-code, and promotion mutations independently check administrator access on the server.
- Dashboard counts query current database records. Section management supports create/edit/archive, activation/homepage/navigation flags, item limits, content assignment, keyboard-accessible ordering controls, and public preview links.
- Content editing supports short/full descriptions, featured/member-only flags, and multi-section assignments. Section/content order changes use database RPCs inside the existing RLS model.
- The administrator activity log records supported mutations. It is not a complete log of every possible administrative operation.
- The current Studio is not yet a separate centralized asset browser, and it uses accessible move-up/move-down controls rather than drag-and-drop. The current dashboard does not implement analytics or a full media-location/replacement browser.

## 4. Authentication and membership security

- The global header listens for Supabase auth-state changes and swaps sign-in/join links for Library/Profile/Log out controls.
- Video/original playback requires a verified email and active paid Personal or Family Stripe subscription. The server rechecks access on every video range request. School membership does not unlock paid video.
- Member-only legacy audio/PDF media now streams through `/api/media`; its storage URL is not returned to the browser. Private content routes check published status and membership before issuing data.
- Supabase Storage was checked live. `media`, `downloads`, `video-assets`, and `profile-photos` are private. Only `artwork` has public read access. Two broad public read policies for media/downloads were removed. Existing objects were retained (7 in `media`, 0 in `downloads` at review time); no current content rows referenced `storage://media/...`.
- Anonymous access to `validate_school_code` was revoked. School signup now checks a code using the server-only service-role client; redemption remains an authenticated, atomic database operation.
- Cancel Membership schedules cancellation with Stripe and reports the provider's effective period end. The Stripe webhook updates local membership state. Account deletion is authenticated, requires typing `DELETE`, attempts safe Stripe cancellation, records retained billing references in a restricted deletion log, removes the user's auth/profile data, and clears auth cookies. Messages are retained because they are not linked to an account. A failed provider or cleanup operation prevents the endpoint from claiming successful deletion.
- Same-origin validation was added to state-changing account, signup, contact, upload, billing, school-code, favorites/history, admin, and content endpoints.

### Remaining membership limits

- An active Stripe subscription and real webhook could not be tested because Stripe credentials are not configured here.
- A short-lived signed URL is still used internally between the app server and private object storage. For member-only content, the server proxies the object instead of sending that signed URL to the browser.
- The dashboard currently offers Stripe's supported global redemption limit, plan restriction, expiry, discount amount/type, and duration. A per-user redemption limit and future start date are not implemented.
- Membership cancellation is not the same as an immediate refund. The owner must decide and publish the refund terms before accepting charges.

## 5. Database changes

Additive, non-destructive migrations are checked into `supabase/migrations/` and are recorded in the connected Supabase project. Live checks confirmed:

- `sections` and `section_content` exist with section fields, assignment ordering, and RLS.
- `content_views` exists with per-user access and is used by the recent-history profile view.
- `privacy_deletion_log` exists with restricted access and billing-retention fields.
- `content.short_description` exists with a 300-character limit.
- `admin_audit_log` and section assignment RPCs are present.
- School-code anonymous validation was revoked.
- Foreign-key lookup indexes were added for the Supabase advisor findings.
- `media` and `downloads` are private; only the artwork bucket has the public read policy.

The connected Supabase project has 18 recorded migrations. This local package has 14 migration files and is missing four already-applied early files: `20260922182120_add-event-fields-and-registrations`, `20260922182525_role-security-hardening`, `20260922182623_storage-buckets-and-policies`, and `20260922183834_grant-api-role-privileges`. No local migration is ahead of the remote history. **Do not paste or re-run migrations in the existing Supabase project.** The schema is present in the live project, but this package alone cannot recreate the complete database from scratch until those four migration definitions are recovered from a trusted source.

## 6. Security and Supabase advisor findings

The owner/admin checks, content publishing rules, private media routes, server-side Stripe checks, and storage bucket state were reviewed. The Supabase security advisor still reports:

- Several authenticated `SECURITY DEFINER` functions. The inspected functions use a fixed empty `search_path`; self-service functions bind actions to `auth.uid()`, and administrative functions check `user_has_role('administrator')`. These are intentional for operations that need narrowly scoped elevated database access, but should remain under review.
- Three RLS-enabled, no-policy tables: `school_codes`, `school_membership_codes`, and `video_assets`. They are intentionally unavailable to browser roles; the app uses guarded RPCs or server-only service-role access.
- Supabase Auth leaked-password protection is disabled. Turn it on in the Supabase Auth password/security settings before launch.

The performance advisor still reports legacy duplicate/permissive policies, several auth-policy evaluation warnings, and duplicate existing unique indexes. Some permissive policy pairs are needed for the intended public-published-content plus admin access model. The duplicate mailing-list and site-image policies should be consolidated in a later reviewed migration. Unused-index notices are expected before meaningful production traffic; do not remove indexes solely from a zero-traffic report.

## 7. Privacy and minors

The current form rejects an age-group value under 13, but the age selection is self-reported and **does not verify a user's age or parent consent**. Under-13 signup remains blocked until a verified parental-consent flow is integrated. Because this service is designed for teens and may include younger teens, the owner should have qualified counsel assess the intended audience, jurisdictions, data flows, and parent-consent requirements before launch. The FTC explains that COPPA can apply to child-directed services or services with actual knowledge of collecting data from under-13 users, and that covered operators generally need verifiable parental consent before collection. See the [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) and [FTC parental-consent guidance](https://www.ftc.gov/business-guidance/privacy-security/verifiable-parental-consent-childrens-online-privacy-rule). This audit does not determine legal compliance.

Privacy, Terms, Cookies, and Refunds routes exist, but the owner should review and approve their wording and retention practices with qualified counsel for the real operating locations. The refund page currently discloses that no refund eligibility policy has been configured.

## 8. Verification results

| Check | Result |
|---|---|
| `npm run build` | Passed after the final source changes; TypeScript and Next.js production compilation completed. |
| Supabase migration/schema checks | Passed for the new section, history, deletion-log, short-description, and security migrations. |
| Storage bucket/policy check | Passed: media/downloads/video-assets/profile-photos private; artwork public; broad public media/download policies removed. |
| School-code anonymous RPC grant | Passed: `anon` no longer has execute permission. |
| Logged-out lock display and header | Reviewed in source; not exercised in a browser session. |
| Active paid playback / membership cancellation / Stripe promo checkout | Not run: Stripe test credentials and an isolated test customer are unavailable. |
| R2 upload, private playback, migration | Not run end to end: R2 credentials/bucket are not configured locally. |
| Signup/login/logout/account deletion and owner/non-owner denial | Source and server guards reviewed; not exercised with test accounts. |
| Mobile/desktop visual checks | Responsive CSS reviewed; no browser/device run was available in this pass. |
| Automated unit/integration suite | Not present in package scripts; no tests were added. |

## 9. Required manual production setup

1. Add the exact variables listed in `.env.example` to Vercel. Keep service-role, Stripe, and R2 secrets server-only. Set `NEXT_PUBLIC_SITE_URL` to the exact origin for each preview/production deployment; state-changing routes reject mismatched origins.
2. Configure a private Cloudflare R2 bucket and bucket-scoped credentials, then set the R2 CORS policy for the exact deployment origin(s). Run the provided Supabase-to-R2 migration script only after confirming its destination bucket and credentials; it preserves source objects for rollback.
3. Configure Stripe monthly USD prices for Personal ($7.99) and Family ($9.99), set the matching Price IDs, and register `/api/stripe/webhook` for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Use Stripe test mode first; test checkout, webhook delivery, access, cancellation, coupon eligibility, and failed payments before switching live.
4. Configure the Stripe billing portal and explicitly test whether cancellation at period end behaves as the displayed UI promises.
5. Enable Supabase leaked-password protection. Confirm Auth Site URL and redirect allow-list for preview and production URLs.
6. Configure Vercel Firewall rate limits for signup, verification resend, contact, and other public mutation endpoints. Same-origin checks are CSRF protection, not rate limiting.
7. Connect and verify an appropriate parental-consent provider or keep under-13 account creation disabled. Have privacy/terms/refund policy reviewed for the operating jurisdictions.
8. Verify the owner account role, test Studio operations using a separate non-admin account, test locked content against direct media URLs, and run scenarios A–R from the build specification with Stripe test mode and R2 test objects.
9. Only then attach the custom domain and update Vercel `NEXT_PUBLIC_SITE_URL`, Supabase Auth redirects, Stripe webhook URL, and R2 CORS.

## 10. Remaining warnings

- No full production sign-off: Stripe, R2, live email notifications, rate limits, parental-consent provider, and legal approval remain outstanding.
- Contact messages are stored in Supabase but no email notification provider is configured.
- Promo per-customer limit/future start date, drag-and-drop reordering, and a standalone media library are not implemented.
- The PWA can be installed from a supported browser; it is not a native installer/APK and does not bypass app stores with a downloadable native application.
- Never send API keys or secret environment values in chat or put them in client-visible `NEXT_PUBLIC_*` variables.

## 11. Focused follow-up verification — September 30, 2026

- `npm run build` passed after the review; no code changes were retained.
- Local production-server checks returned 200 for the homepage, Listen, and Watch; the homepage showed database-backed shelves and designed empty states. The connected database currently has one published podcast, no video assets, no sections, and no section assignments.
- While logged out, `/dashboard` presented sign-in rather than Studio. Same-origin POST checks to section management, promotion management, cancellation, and promo validation returned 401. An unknown section and unknown media path returned 404. These checks do not verify signed-in account flows.
- Supabase reports RLS enabled on all 17 listed public tables. Content is public-read only when published; sections and assignments have public-read/admin-write policies; favorites and memberships are owner-scoped. `media`, `downloads`, and `video-assets` buckets are private. The three no-policy tables remain intentionally inaccessible to browser roles.
- The Supabase security advisor still reports leaked-password protection disabled and authenticated `SECURITY DEFINER` function notices. The reviewed functions have fixed search paths and checks for user ownership or administrator role; keep them under review.
- Local account deletion and R2 upload returned not-configured responses. This describes the local workspace only, not the Vercel environment. Stripe checkout/cancellation/promotion, actual protected playback, signup/login/logout, account deletion, and section writes still need authorized test accounts and test-mode services/content.
- Live Vercel inspection remains blocked: the connected Vercel tool denied access to the supplied deployment and returned no authorized team/project. The Vercel environment variables therefore could not be verified from this review, even though the owner reports adding them and redeploying.
- No clear production bug was changed. School-code memberships remain excluded from paid media as documented above.

## 12. Paid signup follow-up — September 30, 2026

- The owner tested paid signup and reported the red “checkout is not connected” message before account creation. In the current code, that exact response is returned when `isMembershipBillingConfigured()` is false. For a paid plan, the production runtime must have non-empty `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and the matching `STRIPE_PRICE_PERSONAL_MONTHLY` or `STRIPE_PRICE_FAMILY_MONTHLY`. This guard runs before Supabase creates the account, so the signup error points to production configuration or deployment scope, not a Stripe charge failure.
- Supabase project `mphswidvmesdkefkgwjz` reports `ACTIVE_HEALTHY`; its live schema includes the membership and Stripe-reference columns. A privacy-safe aggregate showed 10 profiles, all `personal` / `inactive`, with zero Stripe customer IDs and zero subscription IDs. There is not yet a successful paid membership reflected in Supabase.
- Local `.env.local` has the public Supabase settings but no Stripe or Cloudflare R2 settings. This does not establish which values exist in Vercel. The Vercel connection still returns no authorized teams and denies deployment access, so Production environment variables, Stripe webhook delivery, and Cloudflare R2 cannot be verified from this workspace.
- Supabase Storage reports `media`, `downloads`, `profile-photos`, and `video-assets` as private, with `artwork` public. These are Supabase buckets and do not verify the separate Cloudflare R2 bucket or credentials.
- `npm run build` passed. No source-code change was indicated by the signup response; checkout is intentionally blocked before account creation when its server-side billing prerequisites are missing.
- Manual unblock: ensure the required Stripe and Supabase server variables above are populated for the Vercel Production environment, use Price IDs from the same Stripe mode as the secret key, configure the Stripe endpoint `https://teens2inspire.org/api/stripe/webhook` for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`, set its signing secret as `STRIPE_WEBHOOK_SECRET`, then redeploy. Cloudflare R2 still needs its account ID, bucket-scoped access key and secret, bucket name, and the allowed origin `https://teens2inspire.org`.

## 13. Follow-up signup, payments, storage, and responsive review — September 30, 2026

- The live Stripe account is in live mode and contains active monthly USD prices matching the app's displayed plans: Personal $7.99/month (`price_1ULE0PIgMA67dR4JrQy2EINd`) and Family $9.99/month (`price_1ULE7KIgMA67dR4JCMyFbFo4`). The live account currently has **no webhook endpoint**, so payment activation, subscription changes, and cancellations cannot synchronize to Supabase until the endpoint is configured.
- The reported pre-account-creation “checkout is not connected” response is returned only when one or more required server variables is empty at runtime: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or the selected plan's `STRIPE_PRICE_PERSONAL_MONTHLY` / `STRIPE_PRICE_FAMILY_MONTHLY`. It is not a frontend-only checkout error. Vercel access is still unavailable here, so the Production scope and values cannot be inspected. A saved-but-empty variable, Preview-only variable, or deployment made before the last variable change can produce this exact result.
- The live R2 bucket `teens2inspire-media` exists, is private (no public `r2.dev` URL), and allows the configured browser upload origin `https://teens2inspire.org`. This verifies the bucket and CORS rule, but not that the deployed Vercel runtime has working R2 credentials.
- A new paid-signup promo-code path was added to the local source: the signup form validates a code before account creation; the server validates it again before creating the account and again when starting Checkout. Stripe remains the source of truth for discount eligibility and amount. These changes are local until the updated source is deployed.
- `npm run build` and `npx tsc --noEmit` passed after the promo-code changes. The package does not define an automated test script or test framework.
- Browser inspection of the local homepage at 390px found no horizontal overflow. This local run could not fetch live Supabase rows because outbound network access from the local app runtime is restricted; the resulting empty shelves are therefore not evidence that production shelves are empty. The live database aggregate confirms one published podcast row, but there is no video playback test account/content in this review.
- Production browser access through the available fetch tool returned a tool-side 502, and the Vercel connector still has no authorized team. Neither result independently establishes that the live site is down. Production deployment logs, environment-variable scopes, and actual signup/webhook delivery remain unverified.
- **Current launch blocker:** create the live Stripe webhook at `https://teens2inspire.org/api/stripe/webhook` for the three events above, put the endpoint signing secret in the Vercel **Production** variable `STRIPE_WEBHOOK_SECRET`, verify all billing variables are present for Production, then redeploy. Do not paste the signing secret into chat. Afterward, test with an isolated Stripe test-mode account before inviting paid members.
- **Migration history correction:** a fresh live migration-list comparison found 18 remote versions but only 14 local SQL files; the four missing early definitions are listed in section 5. The prior statement that local and remote histories match was incorrect. Existing production data and schema were not changed.

## 14. Final focused verification — September 30, 2026

- `npm run build` passed after the latest source changes. `npm run typecheck` passed. `npm test` passed all four membership-access and Stripe-idempotency tests. Node emitted a non-fatal module-type warning for the TypeScript test import.
- The checkout error reported before account creation is generated by the server-side billing readiness guard. It occurs before Supabase creates an account when the Production runtime is missing at least one required setting: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or the selected plan price ID (`STRIPE_PRICE_PERSONAL_MONTHLY` / `STRIPE_PRICE_FAMILY_MONTHLY`). Downloading or uploading unrelated source files does not supply these Vercel environment values. The Vercel connector remains unauthorized, so this review cannot inspect the deployed environment or logs.
- The live Stripe account has Personal and Family prices but no live webhook endpoint was present at the last connected Stripe check. Until the endpoint is registered and its signing secret is saved in Vercel Production, payment events will not synchronize membership state to Supabase. The owner must recheck whether that endpoint has since been added.
- Added a small shared inline SVG icon component and applied it to favorite, search, play, media-card, and section-order controls. This is a visual consistency change and does not alter checkout configuration.
- The existing local production HTTP smoke checks returned 200 for public routes, 307 to `/login` for protected profile/saved/dashboard routes, and 404 for unknown content/section slugs. These checks ran logged out and do not verify authenticated owner behavior or live production routing.
- Supabase RLS/storage findings and live schema checks remain as described in sections 5 and 6. No production schema, user data, or deployment was changed in this final pass.
- Remaining test gaps: there is no authorized owner/non-owner test account, no Stripe test-mode customer/webhook secret, and no local Cloudflare R2 credentials. Therefore real signup confirmation, checkout, webhook-to-profile synchronization, cancellation, protected media playback, Studio writes, and R2 uploads remain unverified end to end.
