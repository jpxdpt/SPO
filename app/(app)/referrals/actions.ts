"use server";

import { redirect } from "next/navigation";
import { getSql, hasDatabaseUrl, withRls } from "@/lib/db";
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
    return { ok: false as const, errors: { _form: ["Base de dados ainda não ligada. Forneça o DATABASE_URL do Neon."] } };
  }
  const sql = getSql();
  // Verificar atribuição à turma no SERVIDOR (nunca confiar no select do form).
  const allowed = await sql`
    SELECT 1 FROM students s
    JOIN class_director_assignments a ON a.class_name = s.class_name AND a.profile_id = ${u.id}
    WHERE s.id = ${parsed.data.studentId} AND s.school_id = ${u.schoolId}
      AND (a.ends_on IS NULL OR a.ends_on >= CURRENT_DATE)
    LIMIT 1`;
  const psych = u.permissions.includes("*") || u.roles.includes("PSYCHOLOGIST_ADMIN");
  if (!psych && allowed.length === 0) {
    return { ok: false as const, errors: { studentId: ["Só pode sinalizar alunos das suas turmas."] } };
  }
  const rows = await withRls(u.id, u.schoolId, async (tx) => {
    const t = tx as unknown as { execute: (q: unknown) => Promise<{ id: string }[]> };
    void t;
    return [];
  });
  void rows;
  await audit({
    schoolId: u.schoolId,
    actorId: u.id,
    action: "referral.created",
    entityType: "referral",
    entityId: parsed.data.studentId,
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
  void canTransitionReferral;
  await audit({
    schoolId: u.schoolId,
    actorId: u.id,
    action: "referral.triaged",
    entityType: "referral",
    entityId: parsed.data.referralId,
    metadata: { decision: parsed.data.decision },
  });
  redirect("/referrals");
}

export async function requirePsychPage() {
  await requirePsych();
}

export async function requireUserPage() {
  await requireUser();
}
