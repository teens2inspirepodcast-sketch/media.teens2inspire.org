"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error();
      setSent(true);
    } catch { setError("We could not send your note just now. Please try again in a moment."); }
    finally { setBusy(false); }
  }

  if (sent) return <div className="contact-confirmation" role="status"><span className="eyebrow">Message received</span><h2>Thanks for reaching out.</h2><p>The Teens2Inspire support team has your note.</p><button className="text-link" type="button" onClick={() => setSent(false)}>Send another message <span aria-hidden="true">→</span></button></div>;
  return <form className="contact-form" onSubmit={submit}><div className="form-row"><label>Your name<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label><label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" /></label></div><label>What is this about?<input name="subject" required minLength={3} maxLength={120} /></label><label>Your note<textarea name="message" rows={5} required minLength={10} maxLength={4000} /></label><label className="honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? <><LoaderCircle size={16} className="spin" />Sending</> : "Send a private note"}</button></form>;
}
