import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function writeAdminAudit(actorId: string, action: string, entityType: string, entityId: string | null, details: Record<string, unknown> = {}) {
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("admin_audit_log").insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId, details });
  return !error;
}
