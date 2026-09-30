"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false); const [confirm, setConfirm] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function removeAccount() {
    if (confirm !== "DELETE") return;
    setBusy(true); setError("");
    try { const response = await fetch("/api/profile/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Account removal could not be completed."); router.replace("/"); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Account removal could not be completed."); }
    finally { setBusy(false); }
  }
  return <div className="delete-account-control"><button className="studio-remove" type="button" onClick={() => { setOpen(!open); setError(""); }}>Delete account</button>{open && <div className="delete-account-confirm" role="group" aria-labelledby="delete-account-title"><h3 id="delete-account-title">Permanently remove your account?</h3><p>This deletes your Teens2Inspire profile, saved items, recently viewed items, and family profiles, then signs you out. If your paid plan is active, Stripe will stop its future renewal at the end of the paid period; your site access ends when this account is removed. Stripe keeps its own billing records. Contact messages are not linked to an account and will remain in the owner inbox.</p><label>Type DELETE to confirm<input value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="off" /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="studio-form-actions"><button type="button" className="studio-remove" onClick={() => { setOpen(false); setConfirm(""); }} disabled={busy}>Keep my account</button><button type="button" className="button button-primary" onClick={removeAccount} disabled={busy || confirm !== "DELETE"}>{busy ? "Deleting…" : "Confirm deletion"}</button></div></div>}</div>;
}
