import type { NextConfig } from "next";
const r2PublicHost = process.env.R2_PUBLIC_BASE_URL ? new URL(process.env.R2_PUBLIC_BASE_URL).hostname : null;
const nextConfig: NextConfig = { poweredByHeader:false, reactStrictMode:true, agentRules:false, distDir:process.env.CODEX_NEXT_DIST_DIR||".next", turbopack:{root:process.cwd()}, images:{remotePatterns:[...(r2PublicHost?[{protocol:"https" as const,hostname:r2PublicHost}]:[])]}, async headers(){return[{source:"/(.*)",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"X-Frame-Options",value:"DENY"},{key:"Permissions-Policy",value:"camera=(), microphone=(self), geolocation=()"}]}]}};
export default nextConfig;
