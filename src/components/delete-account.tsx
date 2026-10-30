"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppTranslation } from "@/components/app-localization";
export function DeleteAccount() {
  const { t } = useAppTranslation();
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const router = useRouter();
  async function remove() {
    const first = window.confirm(t("Permanently delete your Teens2Inspire account? This removes your profile and saved account data. This action cannot be undone."));
    if (!first) return;
    const second = window.prompt(t("Type DELETE to confirm permanent account deletion."));
    if (second !== "DELETE") { setMessage(t("Account deletion cancelled.")); return; }
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/account/delete", { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || t("Could not delete account.")); router.replace("/login?account=deleted"); router.refresh(); }
    catch (e) { setMessage(e instanceof Error ? e.message : t("Could not delete account.")); }
    finally { setBusy(false); }
  }
  return <section className="panel t2i-delete-account-card"><h2>Delete account</h2><p>This permanently removes your account and associated profile data. Cancel any active subscription separately before deleting your account. Account deletion does not automatically stop recurring payments.</p><button className="btn secondary" type="button" disabled={busy} onClick={remove}>{busy ? t("Deleting…") : t("Permanently delete my account")}</button>{message && <p className="notice" role="status">{message}</p>}</section>;
}
