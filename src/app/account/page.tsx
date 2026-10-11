import Link from "next/link";
import MediaNav from "@/components/media-nav";
import MediaFooter from "@/components/media-footer";
import FamilyProfiles from "@/components/family-profiles";
import { requireUser, getOwnProfile } from "@/lib/auth";
import { getMembershipSnapshot } from "@/lib/membership";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "My account | Teens2Inspire" };

export default async function Account() {
  const user = await requireUser("/account");
  const profile = await getOwnProfile(user.id);
  const snapshot = await getMembershipSnapshot(user.id, profile);
  const supabase = await createServerSupabase();
  const { data: family } = await supabase.from("family_profiles").select("id,display_name,first_name,interests,owner_id,created_at,updated_at").eq("owner_id", user.id).order("created_at");
  const familyEnabled = profile?.membership_tier === "family" && snapshot.isActive;
  return <><MediaNav /><main className="shell page"><div className="eyebrow">Your account</div><h1 className="page-title">My Teens2Inspire</h1><div className="wide-grid" style={{ marginTop: 30 }}><div className="feature-card"><div className="eyebrow">Membership</div><h3>{profile?.membership_tier || "Account"}</h3><p>{snapshot.isActive ? "Active membership" : "Your account is active, but member-only content is not currently available."}</p><a className="btn" href="https://teens2inspire.org/download">Account settings</a></div><div className="feature-card"><div className="eyebrow">Profile</div><h3>{profile?.display_name || profile?.first_name || user.email}</h3><p>{user.email}</p></div><div className="feature-card"><div className="eyebrow">Library</div><h3>Saved content</h3><p>Return to podcasts, videos, and resources you saved.</p><Link className="btn" href="/saved">Open library</Link></div></div>
  {profile?.membership_tier === "family" && <FamilyProfiles initialProfiles={family ?? []} enabled={familyEnabled} />}
  <p style={{ marginTop: 30 }}><Link href="/">Back to home</Link></p></main><MediaFooter /></>;
}
