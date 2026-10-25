"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOut() {
  return (
    <button
      className="btn secondary"
      onClick={async () => {
        await createClient().auth.signOut();
        window.location.assign("/");
      }}
    >
      Sign out
    </button>
  );
}
