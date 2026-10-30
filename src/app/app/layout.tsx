import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { PersistentPlayerProvider } from "@/components/persistent-media-player";
import { AppNavigation } from "@/components/app-navigation";
import { AppStartupSplash } from "@/components/app-startup-splash";
import { AppLocalization } from "@/components/app-localization";
import { getAppLanguage } from "@/lib/app-language";
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, supabase } = await requireUser("/app");
  const language = await getAppLanguage(supabase, user!.id);
  const cookieStore = await cookies();
  const selectedId = cookieStore.get("t2i-active-family-profile")?.value;
  let activeProfile: { display_name: string; avatar_path: string | null } = { display_name: profile?.display_name?.trim() || user?.email?.split("@")[0] || "Your account", avatar_path: profile?.avatar_path || null };
  if (selectedId && selectedId !== "owner" && profile?.membership_tier === "family" && profile?.membership_status === "active") {
    const { data } = await supabase.from("family_profiles").select("id,display_name,avatar_path").eq("id", selectedId).eq("owner_id", user!.id).maybeSingle();
    if (data) activeProfile = { display_name: data.display_name, avatar_path: data.avatar_path || null };
  }
  let avatarUrl: string | null = null;
  if (activeProfile.avatar_path) {
    const { data } = await supabase.storage.from("profile-avatars").createSignedUrl(activeProfile.avatar_path, 3600);
    avatarUrl = data?.signedUrl || null;
  }
  const { data: brandSetting } = await supabase.from("marketing_settings").select("setting_value").eq("setting_key", "brand_logo_url").maybeSingle();
  const brandLogo = brandSetting?.setting_value && /^https:\/\//.test(brandSetting.setting_value) ? brandSetting.setting_value : null;
  const displayName = activeProfile.display_name;
  return <AppLocalization language={language}><PersistentPlayerProvider><div className="app-shell t2i-light-streaming">
    <AppStartupSplash />
    <header className="app-topbar">
      <Link className="app-wordmark" href="/app" aria-label="Teens2Inspire home">{brandLogo ? <img src={brandLogo} alt="Teens2Inspire" width={260} height={87}/> : <Image src="/teens2inspire-logo.png" alt="Teens2Inspire" width={260} height={87} priority />}</Link>
      <AppNavigation placement="desktop" />
      <Link href="/app/profile" className="app-account">{avatarUrl ? <img className="account-avatar account-avatar-photo" src={avatarUrl} alt="" /> : <span className="account-avatar" style={{ backgroundColor: profile?.profile_color || "#e94d8a", color: "#fff" }}>{displayName.slice(0,1).toUpperCase()}</span>}<span className="account-name">{displayName}</span><ChevronDown size={14}/></Link>
    </header>
    <div className="app-main-wrap">{children}</div>
    <AppNavigation placement="bottom" />
  </div></PersistentPlayerProvider></AppLocalization>;
}
