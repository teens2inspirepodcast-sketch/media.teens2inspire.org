"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelMembershipButton() {
  const [confirming, setConfirming] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function cancel() {
    setBusy(true); setError(""); setNotice("");
    try { const response = await fetch("/api/stripe/cancel", { method: "POST" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Cancellation could not be completed."); const date = result.accessUntil ? new Date(result.accessUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "the end of this billing period"; setNotice(`Stripe scheduled cancellation. Your paid access remains until ${date}; no future renewal is scheduled.`); setConfirming(false); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Cancellation could not be completed."); }
    finally { setBusy(false); }
  }
  return <div className="cancel-membership-control">{!confirming ? <button type="button" className="studio-remove" onClick={() => { setConfirming(true); setError(""); }}>Cancel membership</button> : <div className="cancel-membership-confirm" role="group" aria-label="Confirm membership cancellation"><p>Stripe will stop the next renewal. Your membership stays active through the paid period shown in your account.</p><div className="studio-form-actions"><button type="button" className="studio-remove" onClick={() => setConfirming(false)} disabled={busy}>Keep membership</button><button type="button" className="button button-primary" onClick={cancel} disabled={busy}>{busy ? "Updating Stripe…" : "Confirm cancellation"}</button></div></div>}{notice && <p className="form-success" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
