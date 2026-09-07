import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, isPsychAdmin, type PermissionCode } from "@/lib/permissions";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  schoolId: string;
  roles: string[];
  permissions: string[];
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = (session as unknown as { user?: SessionUser } | null)?.user;
  if (!u?.id) return null;
  return u;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  return u;
}

/** Verificação de permissão no SERVIDOR. Esconder UI não basta. */
export async function requirePermission(code: PermissionCode): Promise<SessionUser> {
  const u = await requireUser();
  if (u.permissions.includes("*")) return u;
  if (!hasPermission(u.permissions, code)) {
    throw new Error(`403: sem permissão ${code}`);
  }
  return u;
}

export async function requirePsych(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.permissions.includes("*")) return u;
  if (!isPsychAdmin(u.roles)) throw new Error("403: exclusivo da equipa SPO");
  return u;
}
