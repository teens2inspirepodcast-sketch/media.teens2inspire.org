"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Check, LoaderCircle } from "lucide-react";

export function FavoriteButton({ contentId, initiallySaved = false, className = "" }: { contentId: string; initiallySaved?: boolean; className?: string }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function toggle() {
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/favorites", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok) throw new Error("Could not update your saved list.");
      setSaved(!saved);
      setMessage(!saved ? "Saved to your library" : "Removed from your saved library");
    } catch {
      setMessage("That did not save. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className={`icon-button save-button${saved ? " is-saved" : ""} ${className}`} onClick={toggle} disabled={pending} aria-label={saved ? "Remove from saved content" : "Save content"} aria-pressed={saved}>
        {pending ? <LoaderCircle size={17} className="spin" aria-hidden="true" /> : saved ? <Check size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />}
      </button>
      <span className="sr-only" aria-live="polite">{message}</span>
    </>
  );
}
