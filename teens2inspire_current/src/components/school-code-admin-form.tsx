"use client";
import { useState } from "react";
export function SchoolCodeAdminForm() {
  const [schoolName, setSchoolName] = useState(""); const [maxUses, setMaxUses] = useState("1"); const [expiresInDays, setExpiresInDays] = useState("365");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [code, setCode] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setCode("");
    try {
      const response = await fetch("/api/admin/school-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schoolName, maxUses: Number(maxUses), expiresInDays: Number(expiresInDays) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not create the school code.");
      setCode(data.code); setMessage(`Created a code for ${data.schoolName}. Copy it now; it will not be shown again.`); setSchoolName("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create the school code."); }
    finally { setBusy(false); }
  }
  return <><form className="admin-form" onSubmit={submit}>
    <label>School name<input value={schoolName} onChange={e=>setSchoolName(e.target.value)} required maxLength={140}/></label>
    <label>Maximum redemptions<input type="number" min="1" max="10000" value={maxUses} onChange={e=>setMaxUses(e.target.value)} required/></label>
    <label>Expires in days (0 = never)<input type="number" min="0" max="3650" value={expiresInDays} onChange={e=>setExpiresInDays(e.target.value)} required/></label>
    <div className="wide"><button className="btn primary" disabled={busy}>{busy ? "Generating…" : "Create school code"}</button></div>
  </form>{message && <p className="notice" role="status">{message}</p>}{code && <div className="generated-code"><strong>{code}</strong><button type="button" className="btn secondary" onClick={()=>navigator.clipboard.writeText(code).then(()=>setMessage("Code copied. Store it securely and share it only with the school."))}>Copy code</button><p>Save this code now. Only its hash is stored in the database.</p></div>}</>;
}
