# Supabase R2 media function

This function is deployed in the Supabase project and is the server-side authorization point for private Cloudflare R2 media. It supports `upload-url` and `playback-url` actions.

Required Supabase Edge Function secrets: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PRIVATE_BUCKET_NAME` (`teens2inspire-media`). Supabase's built-in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are also used. Never put R2 credentials in `NEXT_PUBLIC_*` variables or client-side code.

The application API routes proxy signed-URL requests to this function using the current authenticated Supabase session. Direct file transfer still goes from the browser to the private R2 bucket using a short-lived signed URL.
