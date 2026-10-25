"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function MembershipActions({ canCancel, alreadyScheduled }: { canCancel: boolean; alreadyScheduled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function cancel() {
    if (!window.confirm("Cancel your membership renewal? Your paid access should remain available until the current billing period ends.")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/membership/cancel", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not cancel membership.");
      setMessage(result.periodEnd ? `Cancellation scheduled. Your access is expected to continue until ${new Date(result.periodEnd).toLocaleDateString()}.` : "Cancellation scheduled at the end of your current billing period.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not cancel membership."); }
    finally { setBusy(false); }
  }
  if (!canCancel) return null;
  return <div className="membership-actions" style={{ marginTop: 16, display: "grid", gap: 8 }}>
    {alreadyScheduled ? <p className="small-note">Your membership is already scheduled to cancel at the end of the current billing period.</p> : <button type="button" className="btn secondary" disabled={busy} onClick={cancel}>{busy ? "Processing…" : "Cancel membership renewal"}</button>}
    {message && <p className="notice" role="status">{message}</p>}
  </div>;
}
