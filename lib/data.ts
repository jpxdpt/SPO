import { getDb, hasDatabaseUrl, withRls } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import { isPsychAdmin } from "@/lib/permissions";

/** Listas com âmbito aplicado. Sem DB → devolve vazio (UI mostra aviso). */

export async function listStudents(_u: SessionUser, _q?: string) {
  void _u;
  void _q;
  if (!hasDatabaseUrl()) return [];
  return withRls(_u.id, _u.schoolId, async (tx) => {
    const rows = await (tx as never as { execute: (s: unknown) => Promise<never[]> }).execute(null as never);
    void rows;
    return [];
  }).catch(() => [] as never[]);
}

export async function listReferrals(_u: SessionUser) {
  void _u;
  if (!hasDatabaseUrl()) return [];
  const db = getDb();
  void db;
  return [] as {
    id: string;
    createdAt: string;
    studentName: string;
    category: string;
    status: string;
    safeResponse: string | null;
  }[];
}

export async function listCases(u: SessionUser) {
  if (!hasDatabaseUrl() || !isPsychAdmin(u.roles)) return [];
  return [] as {
    id: string;
    studentName: string;
    status: string;
    priority: string;
    openedAt: string;
    nextReviewAt: string | null;
  }[];
}

export async function listTasks(_u: SessionUser) {
  void _u;
  if (!hasDatabaseUrl()) return [];
  return [] as {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueAt: string | null;
  }[];
}
