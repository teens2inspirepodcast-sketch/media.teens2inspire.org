"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, LoaderCircle } from "lucide-react";

export function EventRegistration({ eventId, initiallyRegistered = false }: { eventId: string; initiallyRegistered?: boolean }) {
  const [registered, setRegistered] = useState(initiallyRegistered);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function toggle() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/events/register", { method: registered ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId }) });
      if (response.status === 401) { router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }
      if (!response.ok) { const payload = await response.json().catch(() => null); setMessage(payload?.error ?? "We could not update your registration."); return; }
      setRegistered(!registered);
      setMessage(!registered ? "You are on the event list." : "Your registration was removed.");
    } catch { setMessage("We could not update your registration. Try again."); }
    finally { setBusy(false); }
  }

  return <div className="event-registration"><button type="button" className={`button ${registered ? "button-outline" : "button-primary"}`} disabled={busy} onClick={toggle}>{busy ? <LoaderCircle size={16} className="spin" /> : <CalendarCheck size={16} aria-hidden="true" />}{registered ? "Registered" : "Register"}</button>{message && <p className="event-registration-message" role="status">{message}</p>}</div>;
}
