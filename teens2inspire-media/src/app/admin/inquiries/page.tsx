import { requireAdmin } from "@/lib/auth";
export default async function InquiriesAdmin() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("inquiries").select("id,kind,name,email,subject,message,created_at").order("created_at", { ascending: false }).limit(200);
  return <><h1 style={{ fontSize: 42 }}>Inquiries</h1><p>Messages submitted through the public contact form.</p><div className="inquiry-list">{(data || []).map((item: any)=><article className="panel" key={item.id}><div className="eyebrow">{item.kind} · {new Date(item.created_at).toLocaleString()}</div><h3>{item.subject || "No subject"}</h3><p><strong>{item.name}</strong> · <a href={`mailto:${item.email}`}>{item.email}</a></p><p style={{whiteSpace:"pre-wrap"}}>{item.message}</p></article>)}</div>{!data?.length&&<p>No inquiries yet.</p>}</>;
}
