"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, ShieldAlert, X } from "lucide-react";
import { InquiryForm } from "@/components/community-actions";
import type { Database } from "@/types/database";

type Post = Database["public"]["Tables"]["community_posts"]["Row"];
type Report = Database["public"]["Tables"]["community_reports"]["Row"];
type Inquiry = Database["public"]["Tables"]["member_inquiries"]["Row"];
type Message = Database["public"]["Tables"]["member_inquiry_messages"]["Row"];

export function AdminModeration({ posts, reports, inquiries, messages }: { posts: Post[]; reports: Report[]; inquiries: Inquiry[]; messages: Message[] }) {
  const [busyId, setBusyId] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function update(kind: "post" | "report" | "inquiry", id: string, status: string) {
    setBusyId(id); setError("");
    const response = await fetch("/api/admin/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id, status, moderator_note: null }) }).catch(() => null);
    if (!response?.ok) setError("That update could not be saved. Try again."); else router.refresh();
    setBusyId("");
  }
  return <div className="moderation-grid">{error && <p className="form-error" role="alert">{error}</p>}
    <section className="admin-panel moderation-panel"><div className="moderation-heading"><ShieldAlert size={17} /><div><h2>Posts awaiting review</h2><p>Review every post before it is visible to the member community.</p></div></div>{posts.length ? posts.map((post) => <article className="moderation-card" key={post.id}><p>{post.body}</p><small>Submitted {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(post.created_at))}</small><div className="hero-actions"><button className="button button-primary" disabled={Boolean(busyId)} onClick={() => update("post", post.id, "approved")}>{busyId === post.id ? <LoaderCircle size={15} className="spin" /> : <><Check size={14} />Approve</>}</button><button className="button button-secondary" disabled={Boolean(busyId)} onClick={() => update("post", post.id, "rejected")}><X size={14} />Do not share</button></div></article>) : <p className="moderation-empty">Nothing is waiting for review.</p>}</section>
    <section className="admin-panel moderation-panel"><div className="moderation-heading"><ShieldAlert size={17} /><div><h2>Member reports</h2><p>Reports are private and visible only to administrators.</p></div></div>{reports.length ? reports.map((report) => <article className="moderation-card" key={report.id}><p>{report.reason}</p><small>Post reference: {report.post_id.slice(0, 8)}</small><div className="hero-actions"><button className="button button-secondary" disabled={Boolean(busyId)} onClick={() => update("report", report.id, "reviewed")}>{busyId === report.id ? <LoaderCircle size={15} className="spin" /> : "Mark reviewed"}</button><button className="button button-primary" disabled={Boolean(busyId)} onClick={() => update("report", report.id, "resolved")}>Resolve report</button></div></article>) : <p className="moderation-empty">No open reports.</p>}</section>
    <section className="admin-panel moderation-panel moderation-inbox"><div className="moderation-heading"><ShieldAlert size={17} /><div><h2>Private support inbox</h2><p>Conversations stay between the member and Teens2Inspire administrators.</p></div></div>{inquiries.length ? inquiries.map((inquiry) => <article className="moderation-card" key={inquiry.id}><div className="thread-head"><h3>{inquiry.subject}</h3><span className={`thread-status thread-${inquiry.status}`}>{inquiry.status}</span></div>{messages.filter((message) => message.inquiry_id === inquiry.id).map((message) => <div className="thread-message" key={message.id}><span className="eyebrow">{message.sender_id === inquiry.user_id ? "Member" : "Teens2Inspire team"}</span><p>{message.body}</p></div>)}<InquiryForm inquiryId={inquiry.id} /><div className="hero-actions"><button className="button button-secondary" disabled={Boolean(busyId)} onClick={() => update("inquiry", inquiry.id, inquiry.status === "open" ? "resolved" : "open")}>{busyId === inquiry.id ? <LoaderCircle size={15} className="spin" /> : inquiry.status === "open" ? "Mark resolved" : "Reopen"}</button><button className="button button-secondary" disabled={Boolean(busyId)} onClick={() => update("inquiry", inquiry.id, "closed")}>Close conversation</button></div></article>) : <p className="moderation-empty">The support inbox is clear.</p>}</section>
  </div>;
}
