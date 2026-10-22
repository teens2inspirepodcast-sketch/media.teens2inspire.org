"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
export function AuthForm({ mode, initialMessage = "" }: { mode: "signup" | "login"; initialMessage?: string }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(initialMessage); const [accountType, setAccountType] = useState("personal");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget); const accountTypeValue = String(form.get("account_type") || "personal"); const schoolCode = String(form.get("school_code") || "").trim().toUpperCase(); const email = String(form.get("email") || "").trim().toLowerCase(); const password = String(form.get("password") || "");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const callback = new URL("/auth/callback?next=%2Fapp", window.location.origin).toString();
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback, data: { account_type: accountTypeValue, school_code: accountTypeValue === "school" ? schoolCode : null } } });
        if (error) throw error;
        setMessage("Check your email for a verification link. Once verified, return here to sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error;
        const rawNext = new URLSearchParams(window.location.search).get("next") || "/app";
        const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";
        window.location.assign(next);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <form className="media-auth-form" onSubmit={submit}>
    {mode === "signup" && <><label htmlFor="account_type">Account type</label><select id="account_type" name="account_type" value={accountType} onChange={e=>setAccountType(e.target.value)}><option value="personal">Personal membership</option><option value="family">Family membership</option><option value="school">School access (enter your school code)</option></select>{accountType === "school" && <><label htmlFor="school_code">School access code</label><input id="school_code" name="school_code" type="text" required autoCapitalize="characters" placeholder="Enter the code from your school"/></>}</>}
    <label htmlFor="media-auth-email">Email address</label><input id="media-auth-email" name="email" type="email" required autoComplete="email"/>
    <label htmlFor="media-auth-password">Password</label><input id="media-auth-password" name="password" type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"}/>
    {message && <p className="media-auth-message" role="status">{message}</p>}
    <button className="app-primary-button media-auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
    <p className="media-auth-switch">{mode === "signup" ? "Already have an account? " : "New to Teens2Inspire? "}<Link href={mode === "signup" ? "/login" : "/signup"}>{mode === "signup" ? "Sign in" : "Create an account"}</Link></p>
    {mode === "login" && <p className="media-auth-switch"><Link href="https://teens2inspire.org/membership">View membership options</Link></p>}
  </form>;
}
