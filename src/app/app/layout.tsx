import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppNavigation } from "@/components/app-navigation";
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireUser("/app");
  const displayName = profile?.display_name?.trim() || user?.email?.split("@")[0] || "Your account";
  return <div className="app-shell">
    <header className="app-topbar">
      <Link className="app-wordmark" href="/app" aria-label="Teens2Inspire home"><Image src="/teens2inspire-logo.png" alt="Teens2Inspire — a media platform for Jewish teen girls" width={520} height={130} priority /></Link>
      <AppNavigation placement="desktop" />
      <Link href="/app/profile" className="app-account"><span className="account-avatar">{displayName.slice(0,1).toUpperCase()}</span><span className="account-name">{displayName}</span><ChevronDown size={14}/></Link>
    </header>
    <div className="app-main-wrap">{children}</div>
    <AppNavigation placement="bottom" />
  </div>;
}
