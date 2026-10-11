# Deployment checklist — public site
- Attach `teens2inspire.org` and `www.teens2inspire.org` to this project.
- Configure Supabase Auth URLs and redirect allowlist for both domains.
- Wire signup and checkout buttons to the existing verified Supabase Edge Functions; do not place Stripe secrets in the browser or public Vercel variables.
- Run `npm run build` and test mobile navigation, links, accessibility, and reduced motion.
- This project is not approved for production until auth/checkout destinations are confirmed.
