"use client";

import { useState } from "react";

export function MembershipActionButton({ action, tier }: { action: "checkout" | "portal"; tier?: "personal" | "family" }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [code, setCode] = useState(""); const [appliedCode, setAppliedCode] = useState(""); const [promoMessage, setPromoMessage] = useState("");
  const isCheckout = action === "checkout";
  async function apply() {
    setBusy(true); setPromoMessage(""); setError(""); setAppliedCode("");
    try {
      const response = await fetch("/api/stripe/promo/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, tier }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "This promo code couldn’t be applied.");
      setAppliedCode(code.trim().toUpperCase()); setPromoMessage(result.message || "Valid code. Stripe will apply the discount at checkout.");
    } catch (reason) { setPromoMessage(reason instanceof Error ? reason.message : "This promo code couldn’t be applied."); }
    finally { setBusy(false); }
  }
  async function go() {
    if (code.trim() && appliedCode !== code.trim().toUpperCase()) { setError("Apply your promo code before continuing."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/stripe/${isCheckout ? "checkout" : "portal"}`, { method: "POST", ...(isCheckout && tier ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier, promoCode: appliedCode }) } : {}) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "We couldn’t continue. Please try again.");
      window.location.assign(result.url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn’t continue. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="membership-action-wrap">{isCheckout && <div className="promo-checkout-field"><label>Promo code<input value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setAppliedCode(""); setPromoMessage(""); }} maxLength={40} autoComplete="off" /></label><button type="button" onClick={apply} disabled={busy || !code.trim()}>Apply</button></div>}{promoMessage && <p className={appliedCode ? "promo-feedback is-valid" : "promo-feedback"} role="status">{promoMessage}</p>}<button className="button button-primary" type="button" onClick={go} disabled={busy}>{busy ? "One moment…" : isCheckout ? `Choose ${tier === "family" ? "Family" : "Personal"} plan` : "Manage or cancel membership"}<span aria-hidden="true">↗</span></button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
