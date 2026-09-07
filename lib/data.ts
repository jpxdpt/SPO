import { hasDatabaseUrl, withRls } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import { isAdministrator, isPsychologist } from "@/lib/permissions";

/** Listas com âmbito aplicado. Sem DB → devolve vazio (UI mostra aviso). */

export async function listStudents(u: SessionUser, q?: string) {
  if (!hasDatabaseUrl()) return [];
  const term = q?.trim() ?? "";
  return withRls(u.id, u.schoolId, (tx) => tx.unsafe(
    `SELECT id, student_number AS "studentNumber", full_name AS "fullName",
      date_of_birth AS "dateOfBirth", class_name AS "className", active
     FROM students
     WHERE school_id = $1 AND active = true
       AND ($2 = '' OR full_name ILIKE '%' || $2 || '%' OR student_number ILIKE '%' || $2 || '%' OR class_name ILIKE '%' || $2 || '%')
     ORDER BY class_name, full_name`,
    [u.schoolId, term]
  ));
}

export async function listReferrals(u: SessionUser) {
  if (!hasDatabaseUrl()) return [];
  return withRls(u.id, u.schoolId, (tx) => tx.unsafe(
    `SELECT r.id, r.created_at AS "createdAt", s.full_name AS "studentName",
      r.category, r.status, r.safe_response_to_referrer AS "safeResponse",
      r.factual_description AS "factualDescription", r.urgency
     FROM referrals r JOIN students s ON s.id = r.student_id
     WHERE r.school_id = $1
     ORDER BY r.created_at DESC`,
    [u.schoolId]
  ));
}

export async function listCases(u: SessionUser) {
  if (!hasDatabaseUrl() || !isPsychologist(u.roles)) return [];
  return withRls(u.id, u.schoolId, (tx) => tx.unsafe(
    `SELECT c.id, s.full_name AS "studentName", c.status, c.priority,
      c.opened_at AS "openedAt", c.next_review_at AS "nextReviewAt", c.main_reason AS "mainReason"
     FROM cases c JOIN students s ON s.id = c.student_id
     WHERE c.school_id = $1 ORDER BY c.opened_at DESC`,
    [u.schoolId]
  ));
}

export async function listTasks(u: SessionUser) {
  if (!hasDatabaseUrl()) return [];
  return withRls(u.id, u.schoolId, (tx) => tx.unsafe(
    `SELECT id, title, status, priority, due_at AS "dueAt", case_id AS "caseId"
     FROM tasks WHERE school_id = $1 ORDER BY due_at NULLS LAST, created_at DESC`,
    [u.schoolId]
  ));
}

export async function listAppointments(u: SessionUser) {
  if (!hasDatabaseUrl() || !isPsychologist(u.roles)) return [];
  return withRls(u.id, u.schoolId, (tx) => tx.unsafe(
    `SELECT a.id, a.type, a.starts_at AS "startsAt", a.ends_at AS "endsAt",
      a.room, a.status, s.full_name AS "studentName"
     FROM appointments a JOIN cases c ON c.id = a.case_id
     JOIN students s ON s.id = c.student_id
     WHERE a.school_id = $1 ORDER BY a.starts_at`,
    [u.schoolId]
  ));
}

export async function getCaseDetail(u: SessionUser, caseId: string) {
  if (!hasDatabaseUrl() || !isPsychologist(u.roles)) return null;
  return withRls(u.id, u.schoolId, async (tx) => {
    const cases = await tx.unsafe(
      `SELECT c.id, c.student_id AS "studentId", s.full_name AS "studentName", c.status,
        c.priority, c.main_reason AS "mainReason", c.opened_at AS "openedAt",
        c.next_review_at AS "nextReviewAt", c.closed_at AS "closedAt", c.close_reason AS "closeReason",
        c.close_summary AS "closeSummary"
       FROM cases c JOIN students s ON s.id = c.student_id
       WHERE c.id = $1 AND c.school_id = $2`, [caseId, u.schoolId]
    );
    if (!cases.length) return null;
    const events = await tx.unsafe(
      `SELECT id, event_type AS "eventType", occurred_at AS "occurredAt", summary, visibility
       FROM case_events WHERE case_id = $1 AND school_id = $2 ORDER BY occurred_at DESC`, [caseId, u.schoolId]
    );
    const appointments = await tx.unsafe(
      `SELECT id, type, starts_at AS "startsAt", ends_at AS "endsAt", room, status
       FROM appointments WHERE case_id = $1 AND school_id = $2 ORDER BY starts_at DESC`, [caseId, u.schoolId]
    );
    return { case: cases[0], events, appointments };
  });
}

export async function dashboardMetrics(u: SessionUser) {
  if (!hasDatabaseUrl()) return { activeCases: 0, monthlyReferrals: 0, completedAppointments: 0, overdueTasks: 0 };
  return withRls(u.id, u.schoolId, async (tx) => {
    if (isAdministrator(u.roles)) return { activeCases: 0, monthlyReferrals: 0, completedAppointments: 0, overdueTasks: 0 };
    const rows = await tx.unsafe(
      `SELECT
        (SELECT count(*)::int FROM cases WHERE school_id = $1 AND status = 'ATIVO') AS "activeCases",
        (SELECT count(*)::int FROM referrals WHERE school_id = $1 AND created_at >= date_trunc('month', now())) AS "monthlyReferrals",
        (SELECT count(*)::int FROM appointments WHERE school_id = $1 AND status = 'COMPLETED') AS "completedAppointments",
        (SELECT count(*)::int FROM tasks WHERE school_id = $1 AND status <> 'CONCLUIDA' AND due_at < now()) AS "overdueTasks"`,
      [u.schoolId]
    );
    return rows[0] ?? { activeCases: 0, monthlyReferrals: 0, completedAppointments: 0, overdueTasks: 0 };
  });
}
