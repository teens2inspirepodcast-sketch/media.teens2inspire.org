"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAppTranslation } from "@/components/app-localization";
import { Compass, Search, Bookmark, Settings2, Headphones, Video, BookOpen, FileDown, CalendarDays } from "lucide-react";

const desktopItems = [
  { label: "Explore", href: "/app", Icon: Compass },
  { label: "Listen", href: "/app/explore?type=podcast", Icon: Headphones },
  { label: "Watch", href: "/app/explore?type=video", Icon: Video },
  { label: "Read", href: "/app/explore?type=article", Icon: BookOpen },
  { label: "Printables", href: "/app/explore?type=printable", Icon: FileDown },
  { label: "Events", href: "/app/events", Icon: CalendarDays },
  { label: "Search", href: "/app/search", Icon: Search },
  { label: "My List", href: "/app/library", Icon: Bookmark },
  { label: "Settings", href: "/app/profile", Icon: Settings2 },
];
const bottomItems = [
  { label: "Explore", href: "/app", Icon: Compass },
  { label: "Search", href: "/app/search", Icon: Search },
  { label: "Library", href: "/app/library", Icon: Bookmark },
  { label: "Events", href: "/app/events", Icon: CalendarDays },
  { label: "Settings", href: "/app/profile", Icon: Settings2 },
];
export function AppNavigation({ placement }: { placement: "desktop" | "bottom" }) {
  const { t } = useAppTranslation();
  const rawPathname = usePathname();
  const searchParams = useSearchParams();
  const pathname = rawPathname || "/app";
  const type = searchParams.get("type") || "";
  const items = placement === "bottom" ? bottomItems : desktopItems;
  const active = (href: string) => {
    if (href === "/app") return pathname === "/app" || pathname === "/app/explore" && !type || pathname.startsWith("/app/content/");
    if (href.includes("?type=")) return pathname === "/app/explore" && type === href.split("type=")[1];
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  return <nav className={placement === "bottom" ? "app-bottom-nav" : "app-desktop-nav"} aria-label="Media app navigation">
    {items.map(({ label, href, Icon }) => <Link href={href} key={href} className={active(href) ? "is-active" : ""} aria-current={active(href) ? "page" : undefined}>
      <Icon size={placement === "bottom" ? 24 : 15} strokeWidth={active(href) ? 2.4 : 1.8}/><span>{t(label)}</span>
    </Link>)}
  </nav>;
}
