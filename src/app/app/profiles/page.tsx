import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { switchFamilyProfile, switchToOwnerProfile } from "../profile/actions";

export default async function ProfilesPage() {
  const { user, profile, supabase } = await requireUser("/app/profiles");
  if (profile?.membership_tier !== "family" || profile?.membership_status !== "active") return <main className="profile-picker-page"><Image src="/icon-512.png" alt="Teens2Inspire Media" width={64} height={64}/><h1>Welcome to Teens2Inspire Media</h1><p>Find something meaningful to watch, listen to, or read.</p><Link className="cinematic-primary" href="/app">Continue</Link></main>;
  const cookieStore = await cookies();
  const selectedId = cookieStore.get("t2i-active-family-profile")?.value || "owner";
  const { data: familyProfiles } = await supabase.from("family_profiles").select("id,display_name,avatar_path").eq("owner_id", user!.id).order("created_at");
  const ownerAvatar = profile.avatar_path ? (await supabase.storage.from("profile-avatars").createSignedUrl(profile.avatar_path, 3600)).data?.signedUrl : null;
  const family = await Promise.all((familyProfiles || []).map(async item => ({...item, avatarUrl: item.avatar_path ? (await supabase.storage.from("profile-avatars").createSignedUrl(item.avatar_path, 3600)).data?.signedUrl : null})));
  return <main className="profile-picker-page">
    <div className="profile-picker-brand"><Image src="/icon-512.png" alt="Teens2Inspire Media" width={58} height={58} priority/><span>TEENS2INSPIRE <b>MEDIA</b></span></div>
    <div className="profile-picker-content"><span className="cinematic-eyebrow">YOUR FAMILY SPACE</span><h1>Who’s watching today?</h1><p>Choose your profile to make this space feel like yours.</p>
      <div className="cinematic-profile-grid">
        <form action={switchToOwnerProfile}><button className="cinematic-profile" type="submit"><span className="cinematic-avatar">{ownerAvatar ? <img src={ownerAvatar} alt=""/> : (profile.display_name || user!.email || "T").slice(0,1).toUpperCase()}</span><strong>{profile.display_name || "Account holder"}</strong>{selectedId === "owner" && <small>Last selected</small>}</button></form>
        {family.map(item => <form action={switchFamilyProfile} key={item.id}><input type="hidden" name="profile_id" value={item.id}/><button className="cinematic-profile" type="submit"><span className="cinematic-avatar">{item.avatarUrl ? <img src={item.avatarUrl} alt=""/> : item.display_name.slice(0,1).toUpperCase()}</span><strong>{item.display_name}</strong>{selectedId === item.id && <small>Last selected</small>}</button></form>)}
        {family.length < 2 && <Link className="cinematic-profile cinematic-add-profile" href="/app/profiles/add"><span className="cinematic-plus">+</span><strong>Add a profile</strong></Link>}
      </div>
      <Link className="profile-picker-manage" href="/app/profile">Manage profiles and settings</Link>
    </div>
    <div className="profile-picker-footer">WATCH · LISTEN · READ · GROW</div>
  </main>;
}
