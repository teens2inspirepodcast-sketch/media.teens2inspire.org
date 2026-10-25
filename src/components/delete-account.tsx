"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function DeleteAccount() {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const router = useRouter();
  async function remove() {
    const first = window.confirm("Permanently delete your Teens2Inspire account? This removes your profile and saved account data. This action cannot be undone.");
    if (!first) return;
    const second = window.prompt('Type DELETE to confirm permanent account deletion.');
    if (second !== "DELETE") { setMessage("Account deletion cancelled."); return; }
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/account/delete", { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not delete account."); router.replace("/login?account=deleted"); router.refresh(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Could not delete account."); }
    finally { setBusy(false); }
  }
  return <section className="panel" style={{ marginTop: 24, borderColor: "#e8cbd4" }}><h2>Delete account</h2><p>This permanently removes your account and associated profile data. Cancel any paid membership separately first; account deletion may not automatically stop Stripe billing.</p><button className="btn secondary" type="button" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Permanently delete my account"}</button>{message && <p className="notice" role="status">{message}</p>}</section>;
}
