import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/** Refresh Supabase auth cookies and route the media subdomain through the media-app pages. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
    const trustedDomain = host === "teens2inspire.org" || host.endsWith(".teens2inspire.org");
    const secure = request.headers.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
    const cookieOptions = trustedDomain
      ? { domain: ".teens2inspire.org", sameSite: "lax" as const, secure: true }
      : { sameSite: "lax" as const, secure };
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  }

  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;
  if (host === "teens2inspire.org" && (pathname === "/app" || pathname.startsWith("/app/") || pathname === "/admin" || pathname.startsWith("/admin/") || ["/explore", "/search", "/library", "/profile"].includes(pathname))) {
    const destination = new URL(`${pathname}${request.nextUrl.search}`, "https://media.teens2inspire.org");
    const redirected = NextResponse.redirect(destination);
    response.cookies.getAll().forEach(cookie => redirected.cookies.set(cookie));
    return redirected;
  }
  if (host !== "media.teens2inspire.org") return response;
  const routeMap: Record<string, string> = {
    "/": "/app",
    "/explore": "/app/explore",
    "/search": "/app/search",
    "/library": "/app/library",
    "/profile": "/app/profile",
  };
  const destination = routeMap[pathname];
  if (!destination) return response;
  const url = request.nextUrl.clone(); url.pathname = destination;
  const rewritten = NextResponse.rewrite(url);
  response.cookies.getAll().forEach(cookie => rewritten.cookies.set(cookie));
  return rewritten;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|sw.js).*)"],
};
