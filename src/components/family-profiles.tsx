"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { Database } from "@/types/database";

type FamilyProfile = Database["public"]["Tables"]["family_profiles"]["Row"];

export default function FamilyProfiles({ initialProfiles, enabled }: { initialProfiles: FamilyProfile[]; enabled: boolean }) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function addProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || profiles.length >= 2 || busy) return;
    const formElement = event.currentTarget;
    setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("first_name") ?? "").trim();
    const displayName = String(form.get("display_name") ?? "").trim();
    const { data, error: rpcError } = await createBrowserSupabase().rpc("add_family_profile", { p_display_name: displayName, p_first_name: firstName, p_interests: [] });
    if (rpcError || !data) setError("We could not add that profile. Confirm that your Family membership is active, then try again.");
    else { setProfiles((current) => [...current, data as FamilyProfile]); setNotice("Family profile added."); formElement.reset(); router.refresh(); }
    setBusy(false);
  }

  async function removeProfile(id: string) {
    if (!enabled || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { error: rpcError } = await createBrowserSupabase().rpc("remove_family_profile", { p_profile_id: id });
    if (rpcError) setError("That profile could not be removed. Please try again.");
    else { setProfiles((current) => current.filter((profile) => profile.id !== id)); setNotice("Family profile removed."); router.refresh(); }
    setBusy(false);
  }

  return <section className="section"><div className="section-head"><h2>Family profiles</h2><span>{profiles.length} of 2 additional</span></div><p className="page-sub">Your Family membership supports three profiles total, including the account owner.</p>
    {profiles.length > 0 && <div className="wide-grid" style={{ marginTop: 20 }}>{profiles.map((profile) => <article className="feature-card" key={profile.id}><h3>{profile.display_name}</h3><p>{profile.first_name}</p><button className="btn" type="button" disabled={!enabled || busy} onClick={() => removeProfile(profile.id)}><Trash2 size={15} /> Remove profile</button></article>)}</div>}
    {enabled && profiles.length < 2 && <form className="profile-form" onSubmit={addProfile} style={{ marginTop: 24, maxWidth: 640 }}><h3>Add a profile</h3><div className="form-row"><label>First name<input name="first_name" required minLength={1} maxLength={60} /></label><label>Display name<input name="display_name" required minLength={1} maxLength={40} /></label></div><button className="btn primary" type="submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Plus size={16} />} Add family profile</button></form>}
    {!enabled && <p className="page-sub">An active Family membership is required to manage family profiles.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
  </section>;
}
