import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refunds and cancellations" };

export default function RefundsPage() {
  return <article className="legal-page page-shell">
    <span className="eyebrow eyebrow-line">Membership billing</span>
    <h1>Refunds &amp; <em>cancellations.</em></h1>
    <p className="legal-lead">You can request cancellation from your profile. The site sends cancellation requests to Stripe and shows the effective date returned by Stripe.</p>
    <section><h2>Cancel a membership</h2><p>Sign in, open your profile, and choose Cancel Membership. For a paid subscription, cancellation is scheduled with Stripe. If it is set to cancel at the end of the current paid period, access remains active through the date shown in your account; Stripe should not renew it after that date. Contact Teens2Inspire if your account does not show the expected status.</p></section>
    <section><h2>Refund requests</h2><p>A refund eligibility policy has not yet been configured for this service. Contact Teens2Inspire through the Contact page with the email used for billing and the charge date so the owner can review the request. Do not send full card numbers or security codes.</p></section>
    <p className="legal-note">This page reflects current account controls, not a promise that every request will qualify for a refund. The owner must set and review a clear refund policy before accepting public paid memberships.</p>
  </article>;
}
