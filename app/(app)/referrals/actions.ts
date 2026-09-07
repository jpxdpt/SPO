"use server";

import { redirect } from "next/navigation";
import { hasDatabaseUrl, withRls } from "@/lib/db";
import { requirePermission, requirePsych, requireUser } from "@/lib/session";
import { PERMISSIONS, canTransitionReferral } from "@/lib/permissions";
import { referralSchema, triageSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

/** Cria sinalização. Diretor: só alunos das suas turmas (verificado na BD). */
export async function createReferral(formData: FormData) {
  const u = await requirePermission(PERMISSIONS.REFERRALS_CREATE);
  const parsed = referralSchema.safeParse({
    studentId: formData.get("studentId"),
    category: formData.get("category"),
    factualDescription: formData.get("factualDescription"),
    urgency: formData.get("urgency") || "normal",
    contactForClarification: formData.get("contactForClarification") || "",
  });
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten().fieldErrors };
  }
  if (!hasDatabaseUrl()) {
    return { ok: false as const, errors: { _form: ["Base de dados ainda não ligada. Configure DATABASE_URL."] } };
  }
  const referralId = await withRls(u.id, u.schoolId, async (tx) => {
    const allowed = await tx.unsafe(
      `SELECT s.id FROM students s
       WHERE s.id = $1 AND s.school_id = $2`,
      [parsed.data.studentId, u.schoolId]
    );
    if (allowed.length === 0) throw new Error("Aluno fora do âmbito do utilizador.");
    const rows = await tx.unsafe(
      `INSERT INTO referrals
        (school_id, student_id, submitted_by, category, factual_description, urgency, status, contact_for_clarification)
       VALUES ($1, $2, $3, $4, $5, $6, 'RECEBIDA', $7)
       RETURNING id`,
      [u.schoolId, parsed.data.studentId, u.id, parsed.data.category, parsed.data.factualDescription,
        parsed.data.urgency, parsed.data.contactForClarification || null]
    );
    return (rows[0] as unknown as { id: string }).id;
  });
  await audit({
    schoolId: u.schoolId,
    actorId: u.id,
    action: "referral.created",
    entityType: "referral",
    entityId: referralId,
    metadata: { category: parsed.data.category, urgency: parsed.data.urgency },
  });
  redirect("/referrals");
}

/** Triagem SPO: accept | request_info | forward | close. */
export async function triageReferral(formData: FormData) {
  const u = await requirePermission(PERMISSIONS.REFERRALS_TRIAGE);
  const parsed = triageSchema.safeParse({
    referralId: formData.get("referralId"),
    decision: formData.get("decision"),
    note: formData.get("note") || "",
    safeResponseToReferrer: formData.get("safeResponseToReferrer") || "",
    priority: formData.get("priority") || "normal",
    forwardDestination: formData.get("forwardDestination") || "",
    closeReason: formData.get("closeReason") || "",
  });
  if (!parsed.success) return { ok: false as const, errors: parsed.error.flatten().fieldErrors };
  if (!hasDatabaseUrl()) {
    return { ok: false as const, errors: { _form: ["Base de dados ainda não ligada."] } };
  }
  const transition = {
    accept: "SPO_ACOMPANHAMENTO",
    request_info: "PENDENTE_INFO",
    forward: "ENCAMINHADA",
    close: "ENCERRADA",
  }[parsed.data.decision];
  const result = await withRls(u.id, u.schoolId, async (tx) => {
    const currentRows = await tx.unsafe(
      `SELECT id, student_id AS "studentId", submitted_by AS "submittedBy", status, category
       FROM referrals WHERE id = $1 AND school_id = $2 FOR UPDATE`,
      [parsed.data.referralId, u.schoolId]
    );
    const current = currentRows[0] as unknown as { id: string; studentId: string; submittedBy: string; status: string; category: string } | undefined;
    if (!current) throw new Error("Sinalização não encontrada.");
    if (!canTransitionReferral(current.status, transition)) throw new Error("Transição de estado inválida.");
    const updated = await tx.unsafe(
      `UPDATE referrals SET status = $1, triaged_by = $2, triaged_at = now(),
        outcome = $3, safe_response_to_referrer = $4, updated_at = now()
       WHERE id = $5 RETURNING id`,
      [transition, u.id, parsed.data.note || parsed.data.closeReason || parsed.data.forwardDestination || null,
        parsed.data.safeResponseToReferrer || null, parsed.data.referralId]
    );
    let caseId: string | null = null;
    if (parsed.data.decision === "accept") {
      const cases = await tx.unsafe(
        `INSERT INTO cases (school_id, student_id, source_referral_id, status, main_reason, priority)
         VALUES ($1, $2, $3, 'ATIVO', $4, $5) RETURNING id`,
        [u.schoolId, current.studentId, current.id, current.category, parsed.data.priority]
      );
      caseId = (cases[0] as unknown as { id: string }).id;
      await tx.unsafe(
        `INSERT INTO case_assignments (case_id, profile_id, role_in_case) VALUES ($1, $2, 'responsavel')`,
        [caseId, u.id]
      );
      await tx.unsafe(
        `INSERT INTO case_events (school_id, case_id, event_type, summary, visibility, created_by)
         VALUES ($1, $2, 'TRIAGE', 'Sinalização aceite e caso criado pela equipa SPO.', 'TEAM', $3)`,
        [u.schoolId, caseId, u.id]
      );
    }
    await tx.unsafe(
      `INSERT INTO notifications (profile_id, type, safe_text, entity_type, entity_id)
       VALUES ($1, 'referral.updated', 'A sua sinalização SPO tem um novo estado.', 'referral', $2)`,
      [current.submittedBy, current.id]
    );
    return { id: (updated[0] as unknown as { id: string }).id, caseId };
  });
  await audit({
    schoolId: u.schoolId,
    actorId: u.id,
    action: "referral.triaged",
    entityType: "referral",
    entityId: result.id,
    metadata: { decision: parsed.data.decision, caseCreated: Boolean(result.caseId) },
  });
  redirect("/referrals");
}

export async function requirePsychPage() {
  await requirePsych();
}

export async function requireUserPage() {
  await requireUser();
}
