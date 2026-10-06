"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { Profile } from "@/lib/auth";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";

const topics = ["Confidence", "Friendship", "Jewish life", "School", "Creativity", "Wellbeing", "Family", "Purpose"];

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [avatarPath, setAvatarPath] = useState(profile?.avatar_path ?? "");
  const avatarUrl = avatarPath.startsWith("avatars/") ? `/api/media/avatar?v=${encodeURIComponent(avatarPath)}` : "";
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function toggle(topic: string) { setInterests((current) => current.includes(topic) ? current.filter((value) => value !== topic) : current.length >= 12 ? current : [...current, topic]); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const supabase = createBrowserSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sign in again to update your profile."); setBusy(false); return; }
    const { error: saveError } = await supabase.from("profiles").update({ first_name: firstName.trim(), display_name: displayName.trim(), interests, avatar_path: avatarPath || null }).eq("id", user.id);
    if (saveError) setError("Your changes could not be saved. Please try again.");
    else setNotice("Your profile is up to date.");
    setBusy(false);
  }

  async function uploadAvatar(file: File) {
    setError(""); setNotice("");
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type) || file.size > 5 * 1024 * 1024) { setError("Choose a JPEG, PNG, or WebP image under 5 MB."); return; }
    setBusy(true);
    const supabase = createBrowserSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sign in again before uploading a profile photo."); setBusy(false); return; }
    const reservation = await fetch("/api/media/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "avatar", fileName: file.name, contentType: file.type, size: file.size }) }).catch(() => null);
    const signed = await reservation?.json().catch(() => null);
    if (!reservation?.ok || !signed?.uploadUrl || !signed?.key) setError(signed?.error ?? "Cloud media storage could not prepare this upload.");
    else {
      const uploaded = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file }).catch(() => null);
      if (!uploaded?.ok) setError("Your photo could not be uploaded. Check the R2 profile media bucket CORS settings.");
      else { setAvatarPath(signed.key); setNotice("Photo uploaded. Save your profile to use it."); }
    }
    setBusy(false);
  }

  async function changeEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const nextEmail = String(form.get("newEmail") ?? "").trim().toLowerCase();
    if (!nextEmail) return;
    setBusy(true);
    const { error: updateError } = await createBrowserSupabase().auth.updateUser({ email: nextEmail });
    if (updateError) setError("We could not update that email. Please try again.");
    else setNotice("Check your inboxes for a confirmation link to finish changing your email.");
    setBusy(false);
  }

  return <div className="profile-settings-grid"><form className="profile-form" onSubmit={save}><span className="eyebrow">Your profile</span><h2>The details you choose to share.</h2><div className="avatar-editor"><span className="profile-avatar-preview">{avatarUrl ? <Image src={avatarUrl} alt="Your profile photo" width={64} height={64} unoptimized /> : (displayName || firstName || "T").slice(0, 1).toUpperCase()}</span><label className="avatar-upload-label">Profile photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && uploadAvatar(event.target.files[0])} /><small>JPEG, PNG, or WebP · Up to 5 MB. Only you can view it.</small></label></div><label>First name<input value={firstName} onChange={(event) => setFirstName(event.target.value)} minLength={1} maxLength={60} required autoComplete="given-name" /></label><label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={1} maxLength={40} required autoComplete="nickname" /></label><fieldset className="interest-fieldset"><legend>Things you are into</legend><div className="topic-chips">{topics.map((topic) => <button key={topic} type="button" className={interests.includes(topic) ? "topic-chip selected" : "topic-chip"} aria-pressed={interests.includes(topic)} onClick={() => toggle(topic)}>{topic}</button>)}</div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}<button className="button button-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : "Save changes"}</button></form><div className="profile-account"><span className="eyebrow">Account and privacy</span><h2>Good to know.</h2><div className="account-row"><span>Email address</span><strong>{email}</strong></div><div className="account-row"><span>Membership</span><a href="/v2/membership">{profile?.membership_status === "active" ? "Active" : "Free account"}</a></div><form className="email-change-form" onSubmit={changeEmail}><label>Change email address<input name="newEmail" type="email" required maxLength={254} autoComplete="email" /></label><button type="submit" className="text-link" disabled={busy}>Request email change <span aria-hidden="true">→</span></button></form><p className="privacy-note">Your profile is private. Other members do not see your email address or profile details.</p><a href="/forgot-password" className="text-link">Reset your password <span aria-hidden="true">→</span></a><a href="/contact?topic=account%20deletion" className="text-link">Ask about account deletion <span aria-hidden="true">→</span></a></div></div>;
}
