"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Search, Bookmark, Settings2 } from "lucide-react";

const items = [
  { label: "Explore", href: "/app", Icon: Compass },
  { label: "Search", href: "/app/search", Icon: Search },
  { label: "Library", href: "/app/library", Icon: Bookmark },
  { label: "Settings", href: "/app/profile", Icon: Settings2 },
];

export function AppNavigation({ placement }: { placement: "desktop" | "bottom" }) {
  const rawPathname = usePathname();
  const routeAliases: Record<string, string> = { "/": "/app", "/explore": "/app/explore", "/search": "/app/search", "/library": "/app/library", "/profile": "/app/profile" };
  const pathname = routeAliases[rawPathname] || rawPathname;
  const active = (href: string) => href === "/app" ? pathname === "/app" || pathname === "/app/explore" || pathname.startsWith("/app/content/") : pathname === href || pathname.startsWith(`${href}/`);
  return <nav className={placement === "bottom" ? "app-bottom-nav" : "app-desktop-nav"} aria-label="Media app navigation">
    {items.map(({ label, href, Icon }) => <Link href={href} key={href} className={active(href) ? "is-active" : ""} aria-current={active(href) ? "page" : undefined}>
      <Icon size={placement === "bottom" ? 21 : 17} strokeWidth={active(href) ? 2.4 : 1.8}/><span>{label}</span>
    </Link>)}
  </nav>;
}
