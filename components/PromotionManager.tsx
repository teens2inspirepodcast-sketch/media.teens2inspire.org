"use client";

import { useEffect, useState, type FormEvent } from "react";

type Promotion = { id: string; code: string; active: boolean; expiresAt: number | null; maxRedemptions: number | null; timesRedeemed: number; description: string; discount: string };
export function PromotionManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  async function refresh() {
    const response = await fetch("/api/admin/promotions", { cache: "no-store" }); const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Couldn’t load promotions."); setPromotions(data.promotions || []);
  }
  useEffect(() => { refresh().catch((error) => setNotice(error instanceof Error ? error.message : "Couldn’t load promotions.")); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(""); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form).entries());
    try { const response = await fetch("/api/admin/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Couldn’t create the code."); setNotice(`Promo code ${result.code} created in Stripe.`); form.reset(); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Couldn’t create the code."); } finally { setBusy(false); }
  }
  async function toggle(promotion: Promotion) {
    setBusy(true); setNotice("");
    try { const response = await fetch("/api/admin/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle", id: promotion.id, active: !promotion.active }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Couldn’t update the code."); await refresh(); setNotice(`${promotion.code} is now ${promotion.active ? "inactive" : "active"}.`); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Couldn’t update the code."); } finally { setBusy(false); }
  }
  return <section className="studio-editor promotion-manager" id="promotions"><span className="eyebrow">Stripe-native discounts</span><h2>Promo codes</h2><p>Stripe validates and applies each promotion at checkout. The amount and eligibility are never accepted from the browser.</p>{notice && <p className="form-success" role="status">{notice}</p>}
    <form className="studio-form" onSubmit={create}><div className="form-grid"><label>Code<input name="code" maxLength={40} pattern="[A-Za-z0-9-]{3,40}" required placeholder="WELCOME10" /></label><label>Description<input name="description" maxLength={120} required placeholder="Welcome offer" /></label><label>Discount type<select name="discount_type"><option value="percent">Percent off</option><option value="amount">Amount off (USD)</option></select></label><label>Discount amount<input name="amount" type="number" min="0.5" max="100" step="0.01" required defaultValue="10" /></label><label>Applies to<select name="tier"><option value="both">Personal and Family</option><option value="personal">Personal only</option><option value="family">Family only</option></select></label><label>Discount duration<select name="duration"><option value="once">First invoice only</option><option value="repeating">Limited number of months</option><option value="forever">For the life of membership</option></select></label><label>Duration months<input name="duration_months" type="number" min="1" max="24" defaultValue="3" /></label><label>Expiration (optional)<input name="expires_at" type="datetime-local" /></label><label>Maximum redemptions (optional)<input name="max_redemptions" type="number" min="1" max="100000" /></label><label className="section-check"><input type="checkbox" name="active" defaultChecked /> Active when created</label></div><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Create promo code"}</button></form>
    <div className="activity-list promotion-list">{promotions.length ? promotions.map((promotion) => <div className="activity-row promotion-row" key={promotion.id}><span className={`status-dot ${promotion.active ? "status-published" : "status-archived"}`} /><div><b>{promotion.code} · {promotion.discount}</b><small>{promotion.description} · {promotion.timesRedeemed}{promotion.maxRedemptions ? ` / ${promotion.maxRedemptions}` : ""} uses{promotion.expiresAt ? ` · expires ${new Date(promotion.expiresAt * 1000).toLocaleDateString()}` : ""}</small></div><button type="button" className="studio-remove" onClick={() => void toggle(promotion)} disabled={busy}>{promotion.active ? "Deactivate" : "Activate"}</button></div>) : <p className="muted-copy">No Stripe promotion codes found.</p>}</div>
  </section>;
}
