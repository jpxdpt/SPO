"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { hasDatabaseUrl, withRls } from "@/lib/db";
import { PERMISSIONS, canTransitionAppointment } from "@/lib/permissions";
import { requirePermission, requirePsych } from "@/lib/session";
import { appointmentSchema, taskSchema } from "@/lib/validation";
import { createUserSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

export async function createTask(formData: FormData) {
  const u = await requirePermission(PERMISSIONS.TASKS_WRITE);
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    caseId: formData.get("caseId") || null,
    assigneeId: formData.get("assigneeId") || u.id,
    dueAt: formData.get("dueAt") || null,
    priority: formData.get("priority") || "normal",
  });
  if (!parsed.success) return { ok: false as const, errors: parsed.error.flatten().fieldErrors };
  if (!hasDatabaseUrl()) return { ok: false as const, errors: { _form: ["Base de dados não ligada."] } };
  const rows = await withRls(u.id, u.schoolId, (tx) => tx.unsafe(
    `INSERT INTO tasks (school_id, case_id, title, assignee_id, due_at, priority)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [u.schoolId, parsed.data.caseId ?? null, parsed.data.title, parsed.data.assigneeId ?? u.id, parsed.data.dueAt ?? null, parsed.data.priority]
  ));
  await audit({ schoolId: u.schoolId, actorId: u.id, action: "case.created", entityType: "task", entityId: (rows[0] as unknown as { id: string }).id });
  redirect("/tasks");
}

export async function completeTask(formData: FormData) {
  const u = await requirePermission(PERMISSIONS.TASKS_WRITE);
  const taskId = String(formData.get("taskId") ?? "");
  if (!hasDatabaseUrl() || !taskId) return { ok: false as const, errors: { _form: ["Tarefa inválida."] } };
  await withRls(u.id, u.schoolId, (tx) => tx.unsafe(
    `UPDATE tasks SET status = 'CONCLUIDA', updated_at = now()
     WHERE id = $1 AND school_id = $2`, [taskId, u.schoolId]
  ));
  redirect("/tasks");
}

export async function createAppointment(formData: FormData) {
  const u = await requirePsych();
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const parsed = appointmentSchema.safeParse({
    caseId: formData.get("caseId"),
    type: formData.get("type"),
    startsAt: startsAt ? `${startsAt}:00+01:00` : startsAt,
    endsAt: endsAt ? `${endsAt}:00+01:00` : endsAt,
    room: formData.get("room") || "",
    summary: formData.get("summary") || "",
  });
  if (!parsed.success) return { ok: false as const, errors: parsed.error.flatten().fieldErrors };
  if (!hasDatabaseUrl()) return { ok: false as const, errors: { _form: ["Base de dados não ligada."] } };
  const starts = new Date(parsed.data.startsAt);
  const ends = new Date(parsed.data.endsAt);
  const result = await withRls(u.id, u.schoolId, async (tx) => {
    const conflicts = await tx.unsafe(
      `SELECT id FROM appointments WHERE school_id = $1 AND status NOT IN ('CANCELLED', 'NO_SHOW')
       AND (owner_id = $2 OR room = $5)
       AND starts_at < $4 AND ends_at > $3 LIMIT 1`,
      [u.schoolId, u.id, starts, ends, parsed.data.room || null]
    );
    if (conflicts.length) throw new Error("Existe um conflito de agenda para a psicóloga ou sala.");
    const rows = await tx.unsafe(
      `INSERT INTO appointments (school_id, case_id, type, starts_at, ends_at, room, owner_id, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [u.schoolId, parsed.data.caseId, parsed.data.type, starts, ends, parsed.data.room || null, u.id, parsed.data.summary || null]
    );
    return (rows[0] as unknown as { id: string }).id;
  });
  await audit({ schoolId: u.schoolId, actorId: u.id, action: "appointment.created", entityType: "appointment", entityId: result });
  redirect("/calendar");
}

export async function updateAppointmentStatus(formData: FormData) {
  const u = await requirePsych();
  const id = String(formData.get("appointmentId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!hasDatabaseUrl() || !id) return { ok: false as const, errors: { _form: ["Atendimento inválido."] } };
  await withRls(u.id, u.schoolId, async (tx) => {
    const rows = await tx.unsafe(`SELECT status FROM appointments WHERE id = $1 AND school_id = $2 FOR UPDATE`, [id, u.schoolId]);
    const current = (rows[0] as unknown as { status: string } | undefined)?.status;
    if (!current || !canTransitionAppointment(current, status)) throw new Error("Transição de atendimento inválida.");
    await tx.unsafe(`UPDATE appointments SET status = $1, updated_at = now() WHERE id = $2`, [status, id]);
    if (status === "COMPLETED") {
      const event = await tx.unsafe(`SELECT case_id FROM appointments WHERE id = $1`, [id]);
      const caseId = (event[0] as unknown as { case_id: string }).case_id;
      await tx.unsafe(
        `INSERT INTO case_events (school_id, case_id, event_type, summary, visibility, created_by)
         VALUES ($1, $2, 'APPOINTMENT_COMPLETED', 'Atendimento concluído; registo estruturado pendente.', 'TEAM', $3)`,
        [u.schoolId, caseId, u.id]
      );
    }
  });
  await audit({ schoolId: u.schoolId, actorId: u.id, action: "appointment.completed", entityType: "appointment", entityId: id, metadata: { status } });
  redirect("/calendar");
}

export async function closeCase(formData: FormData) {
  const u = await requirePsych();
  const caseId = String(formData.get("caseId") ?? "");
  const reason = String(formData.get("closeReason") ?? "").trim();
  const summary = String(formData.get("closeSummary") ?? "").trim();
  if (!caseId || !reason || !summary) return { ok: false as const, errors: { _form: ["Motivo e resumo mínimo são obrigatórios."] } };
  if (!hasDatabaseUrl()) return { ok: false as const, errors: { _form: ["Base de dados não ligada."] } };
  await withRls(u.id, u.schoolId, async (tx) => {
    const result = await tx.unsafe(
      `UPDATE cases SET status = 'ENCERRADO', closed_at = now(), close_reason = $1, close_summary = $2, updated_at = now()
       WHERE id = $3 AND school_id = $4 AND status <> 'ENCERRADO' RETURNING id`,
      [reason, summary, caseId, u.schoolId]
    );
    if (!result.length) throw new Error("Caso não encontrado ou já encerrado.");
    await tx.unsafe(
      `INSERT INTO case_events (school_id, case_id, event_type, summary, visibility, created_by)
       VALUES ($1, $2, 'CASE_CLOSED', $3, 'TEAM', $4)`,
      [u.schoolId, caseId, `Caso encerrado: ${reason}.`, u.id]
    );
  });
  await audit({ schoolId: u.schoolId, actorId: u.id, action: "case.closed", entityType: "case", entityId: caseId });
  redirect(`/cases/${caseId}`);
}

export async function createManagedUser(formData: FormData) {
  const u = await requirePermission(PERMISSIONS.USERS_MANAGE);
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleCode: formData.get("roleCode"),
  });
  if (!parsed.success) return { ok: false as const, errors: parsed.error.flatten().fieldErrors };
  if (!hasDatabaseUrl()) return { ok: false as const, errors: { _form: ["Base de dados não ligada."] } };
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const profileId = crypto.randomUUID();
  await withRls(u.id, u.schoolId, async (tx) => {
    const roles = await tx.unsafe(`SELECT id FROM roles WHERE school_id = $1 AND code = $2 LIMIT 1`, [u.schoolId, parsed.data.roleCode]);
    if (!roles.length) throw new Error("Papel não encontrado.");
    const existing = await tx.unsafe(`SELECT id FROM profiles WHERE lower(email) = lower($1) LIMIT 1`, [parsed.data.email]);
    if (existing.length) throw new Error("Já existe uma conta com este email.");
    await tx.unsafe(
      `INSERT INTO profiles (id, school_id, name, email, password_hash, active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [profileId, u.schoolId, parsed.data.name, parsed.data.email, passwordHash]
    );
    await tx.unsafe(
      `INSERT INTO user_roles (profile_id, role_id, granted_by) VALUES ($1, $2, $3)`,
      [profileId, (roles[0] as unknown as { id: string }).id, u.id]
    );
  });
  await audit({ schoolId: u.schoolId, actorId: u.id, action: "user.role_granted", entityType: "profile", entityId: profileId, metadata: { roleCode: parsed.data.roleCode } });
  redirect("/settings");
}
