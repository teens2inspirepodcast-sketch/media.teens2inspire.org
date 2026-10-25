import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createFamilyProfile } from "../../profile/actions";
export default async function AddFamilyProfilePage() {
  const { profile } = await requireUser("/app/profiles/add");
  const allowed = profile?.membership_tier === "family" && profile?.membership_status === "active";
  return <main className="profile-add-page"><Link href="/app/profiles" className="profile-add-back">← All profiles</Link><div className="profile-add-card"><Image src="/icon-512.png" alt="Teens2Inspire Media" width={54} height={54}/><span className="cinematic-eyebrow">MAKE IT YOURS</span><h1>Add a profile</h1><p>Create a separate space for another family member.</p>{allowed ? <form action={createFamilyProfile} className="cinematic-add-form"><label>First name<input name="first_name" required maxLength={60} placeholder="First name" autoComplete="given-name"/></label><label>Profile name<input name="display_name" required maxLength={40} placeholder="What should we call this profile?"/></label><button className="cinematic-primary" type="submit">Create profile</button></form> : <p>Your account needs an active Family membership to add profiles.</p>}<Link href="/app/profiles" className="profile-add-cancel">Cancel</Link></div></main>;
}
