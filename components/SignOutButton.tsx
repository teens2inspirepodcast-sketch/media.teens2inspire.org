"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useState } from "react";
export function SignOutButton() {
  const router = useRouter(); const [error, setError] = useState("");
  async function signOut() {
    setError("");
    try {
      const result = await createClient().auth.signOut();
      if (result.error) throw result.error;
      router.replace("/"); router.refresh();
    } catch { setError("We couldn’t sign you out. Please try again."); }
  }
  return <div><button type="button" className="button button-outline" onClick={() => void signOut()}>Sign out</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
