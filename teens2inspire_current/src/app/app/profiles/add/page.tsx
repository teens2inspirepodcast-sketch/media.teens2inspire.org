import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createFamilyProfile } from "../../profile/actions";
export default async function AddFamilyProfilePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requireUser("/app/profiles/add");
  const params = await searchParams;
  const errors: Record<string,string> = { unavailable: "An active Family membership is required to add profiles.", limit: "You already have the maximum of three profiles.", "save-failed": "The profile could not be saved. Please try again." };
  const allowed = profile?.membership_tier === "family" && profile?.membership_status === "active";
  return <main className="profile-add-page"><Link href="/app/profiles" className="profile-add-back">← All profiles</Link><div className="profile-add-card"><Image src="/icon-512.png" alt="Teens2Inspire Media" width={54} height={54}/><span className="cinematic-eyebrow">MAKE IT YOURS</span><h1>Add a profile</h1><p>Enter a name to create a profile. You can keep the default picture and colors.</p>{params.error && <p role="alert" className="notice">{errors[params.error] || "Something went wrong. Please try again."}</p>}{allowed ? <form action={createFamilyProfile} className="cinematic-add-form"><input type="hidden" name="return_to" value="add-page"/><label>Profile name<input name="display_name" required maxLength={40} placeholder="Enter a name" autoComplete="off"/></label><button className="cinematic-primary" type="submit">Create profile</button></form> : <p>Your account needs an active Family membership to add profiles.</p>}<Link href="/app/profiles" className="profile-add-cancel">Cancel</Link></div></main>;
}
