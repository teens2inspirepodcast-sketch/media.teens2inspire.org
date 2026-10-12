import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SignOut } from "@/components/sign-out";
import { createFamilyProfile, deleteFamilyProfile } from "./actions";
export default async function Profile({ searchParams }: { searchParams: Promise<{ membership?: string; family?: string }> }) {
  const { user, profile, supabase } = await requireUser("/app/profile"); const params = await searchParams;
  const isActiveFamily = profile?.membership_tier === "family" && profile?.membership_status === "active";
  const { data: familyProfiles } = isActiveFamily ? await supabase.from("family_profiles").select("id,display_name,created_at").eq("owner_user_id", user!.id).order("created_at") : { data: [] as Array<{id:string;display_name:string;created_at:string}> };
  const familyError: Record<string,string> = { unavailable: "Family profile management requires an active Family membership.", limit: "You can create up to two additional profiles (three profiles total including the account holder).", "save-failed": "The profile could not be saved." };
  return <main className="app-content"><h1 style={{ fontSize: 48 }}>Profile</h1><div className="panel"><h3>{profile?.display_name || "Your account"}</h3><p>{user!.email}</p><p>Membership: <strong>{profile?.membership_tier || "personal"}</strong> · Status: <strong>{profile?.membership_status || "inactive"}</strong></p>{params.membership === "success" && <p className="notice">Checkout complete. Membership access will activate after Stripe confirms the subscription.</p>}{params.membership === "cancelled" && <p className="notice">Checkout was cancelled. No membership payment was completed.</p>}
    {profile?.membership_status !== "active" && <p><Link className="btn primary" href="https://teens2inspire.org/membership">View membership options</Link></p>}<SignOut/></div>
    {isActiveFamily && <section className="section" style={{ padding: "35px 0" }}><h2 style={{ fontSize: 32 }}>Family profiles</h2><p>The account holder plus up to two additional profiles can share a Family membership.</p>{params.family && <p className="notice">{familyError[params.family] || (params.family === "created" || params.family === "updated" ? "Family profiles updated." : "")}</p>}
      <div className="grid">{(familyProfiles || []).map(item=><article className="card" key={item.id}><h3>{item.display_name}</h3><form action={deleteFamilyProfile}><input type="hidden" name="id" value={item.id}/><button className="btn secondary">Remove profile</button></form></article>)}</div>
      {(familyProfiles || []).length < 2 && <form action={createFamilyProfile} className="form"><label>New profile name<input name="display_name" required maxLength={40}/></label><button className="btn primary">Add family profile</button></form>}
    </section>}
  </main>;
}
