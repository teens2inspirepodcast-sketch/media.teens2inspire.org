import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/auth/callback", "/manifest.webmanifest", "/robots.txt", "/sitemap.xml", "/opengraph-image"]);

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          const sharedDomain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN === ".teens2inspire.org" ? { domain: ".teens2inspire.org" } : {};
          response.cookies.set(name, value, { ...options, ...sharedDomain });
        }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.has(pathname) || pathname.startsWith("/_next/") || pathname.startsWith("/api/") || pathname.startsWith("/icons/") || /\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$/i.test(pathname);

  if (!user && !isPublic) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  if (user && pathname === "/login") {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const target = profile?.role === "administrator" ? "/admin" : "/";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (user && pathname === "/") {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "administrator") return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
