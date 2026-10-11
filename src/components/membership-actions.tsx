"use client";

import { useState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import Link from "next/link";

type MembershipPlan = "personal" | "family";

const plans: Array<{ id: MembershipPlan; name: string; price: string; description: string }> = [
  { id: "personal", name: "Personal", price: "$7.99/month", description: "Your own Teens2Inspire membership." },
  { id: "family", name: "Family", price: "$9.99/month", description: "Membership for your household." },
];

export function MembershipActions({
  active,
  canManage,
  checkoutReady,
  selectedPlan = "personal",
}: {
  active: boolean;
  canManage: boolean;
  checkoutReady: boolean;
  selectedPlan?: MembershipPlan;
}) {
  const [busy, setBusy] = useState<MembershipPlan | "portal" | null>(null);
  const [error, setError] = useState("");

  async function openCheckout(plan: MembershipPlan) {
    setBusy(plan);
    setError("");
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    if (response?.ok && payload?.url) window.location.assign(payload.url);
    else {
      setError(payload?.error ?? "Billing is temporarily unavailable. Please try again.");
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    setError("");
    const response = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    if (response?.ok && payload?.url) window.location.assign(payload.url);
    else {
      setError(payload?.error ?? "Billing is temporarily unavailable. Please try again.");
      setBusy(null);
    }
  }

  if (active && canManage) {
    return (
      <div className="membership-action-stack">
        <button className="button button-primary" type="button" disabled={busy !== null} onClick={openPortal}>
          {busy === "portal" ? <LoaderCircle size={15} className="spin" /> : <>Manage billing <ArrowUpRight size={14} /></>}
        </button>
        <p>Update your payment method, review invoices, or cancel through Stripe.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    );
  }

  if (active) {
    return (
      <div className="membership-action-stack">
        <p>Your Teens2Inspire membership is active. For billing changes, message the support team.</p>
        <Link className="text-link" href="/v2/messages">Ask about membership billing</Link>
      </div>
    );
  }

  return (
    <div className="membership-action-stack">
      <div className="membership-plan-options" aria-label="Membership plans">
        {plans.map((plan) => (
          <button
            key={plan.id}
            className={`membership-plan-option${selectedPlan === plan.id ? " is-selected" : ""}`}
            type="button"
            disabled={busy !== null || !checkoutReady}
            aria-pressed={selectedPlan === plan.id}
            onClick={() => openCheckout(plan.id)}
          >
            <span><strong>{plan.name}</strong><small>{plan.description}</small></span>
            <span>{busy === plan.id ? <LoaderCircle size={16} className="spin" /> : plan.price}</span>
          </button>
        ))}
      </div>
      {!checkoutReady && <p>Checkout is not available yet. The Teens2Inspire team is connecting membership billing.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {checkoutReady && <p>Choose a plan to continue to Stripe-secured checkout. Your membership starts after payment is verified.</p>}
    </div>
  );
}
