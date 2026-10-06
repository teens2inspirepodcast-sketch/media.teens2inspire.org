"use client";

import { useState } from "react";
import { Flag, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommunityComposer() {
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    const response = await fetch("/api/community/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) }).catch(() => null);
    if (response?.ok) { form.reset(); setNotice("Your note is in the moderation queue. It will appear here after review."); }
    else setError(response?.status === 403 ? "An active membership is needed to post." : "We could not submit that note. Please try again.");
    setBusy(false);
  }
  return <form className="community-composer" onSubmit={submit}><label htmlFor="community-note">Something on your mind?</label><textarea id="community-note" name="body" minLength={2} maxLength={2000} rows={4} required placeholder="Share a thought, a small win, or a question for the group." /><p>Posts are reviewed by the Teens2Inspire team before they are visible to other members. Keep personal details private.</p>{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}<button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : "Send for review"}</button></form>;
}

export function ReportPostButton({ postId }: { postId: string }) {
  const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false); const [open, setOpen] = useState(false); const [error, setError] = useState("");
  async function report(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
    if (reason.trim().length < 3) { setError("Add a little more detail for the moderation team."); return; }
    setBusy(true);
    const response = await fetch("/api/community/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, reason }) }).catch(() => null);
    if (response?.ok) setSent(true); else setError("We could not send that report. Please try again.");
    setBusy(false);
  }
  return <div className="post-report-control">{sent ? <span className="report-button"><Flag size={14} aria-hidden="true" /> Report sent</span> : <><button type="button" className="report-button" disabled={busy} aria-expanded={open} onClick={() => { setOpen(!open); setError(""); }}><Flag size={14} aria-hidden="true" />Report</button>{open && <form className="report-form" onSubmit={report}><label htmlFor={`report-${postId}`}>What should the Teens2Inspire team know?</label><textarea id={`report-${postId}`} name="reason" minLength={3} maxLength={500} rows={3} required autoFocus />{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-secondary" disabled={busy}>{busy ? <LoaderCircle size={14} className="spin" /> : "Send report privately"}</button></form>}</>}</div>;
}

export function InquiryForm({ inquiryId }: { inquiryId?: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [sent, setSent] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = inquiryId ? { inquiryId, body: form.get("body") } : { subject: form.get("subject"), body: form.get("body") };
    const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => null);
    if (response?.ok) { if (inquiryId) { formElement.reset(); router.refresh(); } else setSent(true); } else setError("Your note could not be delivered. Please try again.");
    setBusy(false);
  }
  if (sent) return <p className="form-success" role="status">Your note is in the private Teens2Inspire support inbox.</p>;
  return <form className="inquiry-form" onSubmit={submit}>{!inquiryId && <label>Subject<input name="subject" required minLength={3} maxLength={120} /></label>}<label>{inquiryId ? "Your reply" : "Message"}<textarea name="body" rows={inquiryId ? 3 : 5} minLength={2} maxLength={4000} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : inquiryId ? "Send reply" : "Send privately"}</button></form>;
}
