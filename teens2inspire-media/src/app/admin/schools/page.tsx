import { requireAdmin } from "@/lib/auth";
import { SchoolCodeAdminForm } from "@/components/school-code-admin-form";
export default async function SchoolsAdmin() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("schools").select("id,name,is_active,created_at").order("created_at", { ascending: false }).limit(100);
  return <><h1 style={{ fontSize: 42 }}>School Access</h1><p>Generate one-time-view school codes. Raw codes are not stored in the database.</p>
    <section className="panel" style={{ margin: "22px 0" }}><h2 style={{ fontSize: 30 }}>Create school code</h2><SchoolCodeAdminForm/></section>
    <h2 style={{ fontSize: 30 }}>Schools</h2><div className="table-wrap"><table><thead><tr><th>School</th><th>Status</th><th>Created</th></tr></thead><tbody>{(data || []).map(s=><tr key={s.id}><td>{s.name}</td><td>{s.is_active ? "Active" : "Inactive"}</td><td>{new Date(s.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>
  </>;
}
