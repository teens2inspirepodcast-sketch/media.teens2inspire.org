import { requireAdmin } from "@/lib/auth";
import { SchoolCodeAdminForm } from "@/components/school-code-admin-form";
import { deleteSchool, deleteSchoolCode, setSchoolCodeStatus } from "./actions";
export default async function SchoolsAdmin({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string; updated?: string }> }) {
  const { supabase } = await requireAdmin(); const query = await searchParams;
  const [{ data: schools }, { data: codes }] = await Promise.all([
    supabase.from("schools").select("id,name,is_active,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("school_codes").select("id,school_id,is_active,created_at,expires_at,max_uses,uses,schools(name)").order("created_at", { ascending: false }).limit(200),
  ]);
  return <><h1 style={{ fontSize: 42 }}>School Access</h1><p>Generate and manage school access codes. For security, raw codes are shown only once when created; existing records show their school, status, usage, and expiry.</p>
    {query.error && <p className="notice" role="alert">{query.error === "delete-failed" ? "Could not delete this record. It may be linked to existing accounts." : "The change could not be saved."}</p>}{query.deleted && <p className="notice">Record deleted.</p>}{query.updated && <p className="notice">School code updated.</p>}
    <section className="panel" style={{ margin: "22px 0" }}><h2 style={{ fontSize: 30 }}>Create school code</h2><SchoolCodeAdminForm/></section>
    <h2 style={{ fontSize: 30 }}>School codes</h2><div className="table-wrap"><table><thead><tr><th>School</th><th>Status</th><th>Uses</th><th>Expires</th><th>Created</th><th>Actions</th></tr></thead><tbody>{(codes || []).map((c: any)=><tr key={c.id}><td>{Array.isArray(c.schools) ? c.schools[0]?.name : c.schools?.name || "School"}</td><td>{c.is_active ? "Active" : "Revoked"}</td><td>{c.uses} / {c.max_uses}</td><td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td><td>{new Date(c.created_at).toLocaleDateString()}</td><td><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><form action={setSchoolCodeStatus}><input type="hidden" name="id" value={c.id}/><input type="hidden" name="is_active" value={c.is_active ? "false" : "true"}/><button className="btn secondary">{c.is_active ? "Revoke" : "Reactivate"}</button></form><form action={deleteSchoolCode}><input type="hidden" name="id" value={c.id}/><button className="btn secondary">Delete</button></form></div></td></tr>)}</tbody></table></div>
    <h2 style={{ fontSize: 30, marginTop: 28 }}>Schools</h2><div className="table-wrap"><table><thead><tr><th>School</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{(schools || []).map(s=><tr key={s.id}><td>{s.name}</td><td>{s.is_active ? "Active" : "Inactive"}</td><td>{new Date(s.created_at).toLocaleDateString()}</td><td><form action={deleteSchool}><input type="hidden" name="id" value={s.id}/><button className="btn secondary">Delete school</button></form></td></tr>)}</tbody></table></div>
  </>;
}
