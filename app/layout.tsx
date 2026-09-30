import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import "./globals.css";
import "./overrides.css";
import type { Viewport } from "next";
import { createClient } from "@/lib/supabase/server";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || "https://teens2inspire.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: "Teens2Inspire | Inspiring Jewish teen girls.", template: "%s | Teens2Inspire" },
  description: "A space to listen, watch, explore, connect and grow together. Made especially for Jewish teen girls.",
  openGraph: { siteName: "Teens2Inspire", type: "website", title: "Teens2Inspire", description: "Inspiring Jewish teen girls." },
  twitter: { card: "summary_large_image", title: "Teens2Inspire", description: "Inspiring Jewish teen girls." },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Teens2Inspire" },
};

export const viewport: Viewport = { themeColor: "#111012", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data: sections } = supabase ? await supabase.from("sections").select("name,slug").eq("is_active", true).eq("show_in_navigation", true).order("display_order").limit(8) : { data: [] };
  return <html lang="en"><body><SiteHeader initialSignedIn={Boolean(user)} sections={sections ?? []} /><main id="main-content">{children}</main><Footer /></body></html>;
}
