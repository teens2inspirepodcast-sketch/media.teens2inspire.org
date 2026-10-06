"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Mode = "login" | "signup" | "recovery" | "new-password";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [accountType, setAccountType] = useState<"school" | "personal" | "family">("personal");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const supabase = createBrowserSupabase();
    // Always send Auth emails back to the production website. Vercel Production should also set NEXT_PUBLIC_SITE_URL.
    const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://teens2inspire.org").replace(/\/$/, "");
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const selectedAccountType = String(form.get("account_type") ?? "personal") as "school" | "personal" | "family";
    try {
      if (mode === "signup" && selectedAccountType === "school") {
        const schoolCode = String(form.get("school_code") ?? "").trim();
        const validation = await fetch("/api/schools/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: schoolCode }) });
        const result = await validation.json();
        if (!validation.ok || !result.valid) throw new Error(result.error || "Invalid school code.");
        form.set("school_code_hash", String(result.schoolCodeHash ?? ""));
      }
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        const next = new URLSearchParams(window.location.search).get("next");
        router.replace(next?.startsWith("/") && !next.startsWith("/v2") ? next : "/download");
        router.refresh();
      } else if (mode === "signup") {
        const firstName = String(form.get("first_name") ?? "").trim();
        const displayName = String(form.get("display_name") ?? "").trim();
        const requestedNext = new URLSearchParams(window.location.search).get("next");
        const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("/v2") ? requestedNext : "/download";
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${siteOrigin}/auth/callback?next=${encodeURIComponent(next)}`,
            data: {
              first_name: firstName,
              display_name: displayName,
              age_group: "13plus",
              membership_tier: accountType,
              account_type: accountType,
              school_code_hash: accountType === "school" ? String(form.get("school_code_hash") ?? "") : "",
              accepted_terms_at: new Date().toISOString(),
            },
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else {
          setMessage("Check your inbox for a secure link to finish creating your account.");
        }
      } else if (mode === "recovery") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteOrigin}/auth/callback?next=/update-password` });
        if (authError) throw authError;
        setMessage("If an account matches that address, a password reset link is on its way.");
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("Your password has been updated.");
        window.setTimeout(() => router.replace("/login"), 900);
      }
    } catch (caught) {
      const validationMessage = caught instanceof Error ? caught.message : "";
      setError(mode === "login" ? "Those sign-in details did not work. Check them and try again." : mode === "signup" ? (validationMessage || "We could not create your account. Check the form and try again.") : "We could not complete that request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Make this space yours" : mode === "recovery" ? "Reset your password" : "Choose a new password";
  const cta = mode === "login" ? "Log in" : mode === "signup" ? "Create my account" : mode === "recovery" ? "Send reset link" : "Save new password";

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="auth-heading"><span className="eyebrow">Teens2Inspire account</span><h1>{title}</h1><p>{mode === "login" ? "Your account gets you into the Teens2Inspire experience." : mode === "signup" ? "Create your account here. Your media experience lives in the Teens2Inspire app." : mode === "recovery" ? "Enter the email address linked to your account." : "Your new password needs at least 10 characters."}</p></div>
      {mode === "signup" && <div className="account-type-grid">{([['school','School — free with a school code'],['personal','Personal — $7.99/month'],['family','Family — $9.99/month, up to 3 profiles']] as const).map(([value,label]) => <label key={value} className={`account-type-option${accountType === value ? " selected" : ""}`}><input type="radio" name="account_type" value={value} checked={accountType === value} onChange={() => setAccountType(value)} /><span>{label}</span></label>)}</div>}
      {mode === "signup" && accountType === "school" && <label>School code<input name="school_code" required minLength={4} maxLength={80} placeholder="Enter the code provided by your school" /></label>}
      {mode === "signup" && <div className="form-row"><label>First name<input name="first_name" autoComplete="given-name" minLength={1} maxLength={60} required /></label><label>What should we call you?<input name="display_name" autoComplete="nickname" minLength={1} maxLength={40} required /></label></div>}
      {mode !== "new-password" && <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>}
      {mode !== "recovery" && <label>Password<span className="password-control"><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={10} maxLength={128} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>}
      {mode === "signup" && <label className="consent-check"><input type="checkbox" required /><span>I am at least 13 years old. I have a parent or guardian’s permission to use Teens2Inspire if I am under 18.</span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle size={17} className="spin" aria-hidden="true" />Working</> : cta}</button>
      {mode === "login" && <Link className="form-quiet-link" href="/forgot-password">Forgot your password?</Link>}
      {mode === "login" && <p className="auth-switch">New to Teens2Inspire? <Link href="/signup">Create an account</Link></p>}
      {mode === "signup" && <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>}
      {(mode === "recovery" || mode === "new-password") && <p className="auth-switch"><Link href="/login">Back to log in</Link></p>}
    </form>
  );
}
