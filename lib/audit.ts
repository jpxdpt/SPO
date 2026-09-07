import { createHash } from "crypto";
import { getSql } from "@/lib/db";

export type AuditAction =
  | "referral.created"
  | "referral.triaged"
  | "case.created"
  | "case.closed"
  | "appointment.created"
  | "appointment.completed"
  | "clinical_note.created"
  | "clinical_note.read"
  | "document.downloaded"
  | "report.exported"
  | "role.permission_changed"
  | "user.role_granted";

export async function audit(opts: {
  schoolId?: string | null;
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  // Sem DB configurada (antes do Neon), não bloquear: log local seguro (sem conteúdo sensível).
  if (!process.env.DATABASE_URL) {
    console.info(`[audit-stub] ${opts.action} ${opts.entityType} ${opts.entityId ?? ""}`);
    return;
  }
  // Nunca registar conteúdo clínico: apenas IDs e factos operacionais.
  const ipHash = opts.ip ? createHash("sha256").update(opts.ip).digest("hex").slice(0, 32) : null;
  const sql = getSql();
  await sql`INSERT INTO audit_events (school_id, actor_id, action, entity_type, entity_id, metadata_json, ip_hash)
    VALUES (${opts.schoolId ?? null}, ${opts.actorId ?? null}, ${opts.action}, ${opts.entityType},
      ${opts.entityId ?? null}, ${opts.metadata ? JSON.stringify(opts.metadata) : null}, ${ipHash})`;
}
