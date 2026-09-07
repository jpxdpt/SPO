import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Sql } from "postgres";
import { normalizeDatabaseUrl } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Lê env com fallback e trata strings vazias como ausentes. */
function envStr(key: string, fallback: string): string {
  const v = (process.env[key] ?? "").trim();
  return v || fallback;
}

async function loadUser(email: string) {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!databaseUrl) return null;
  let sql: Sql | null = null;
  try {
    const postgres = (await import("postgres")).default;
    sql = postgres(databaseUrl, { ssl: process.env.DATABASE_SSL === "false" ? false : "require", max: 2, prepare: false });
    const rows = (await sql`
      SELECT p.id, p.school_id, p.name, p.email, p.password_hash, p.active
      FROM profiles p WHERE lower(p.email) = lower(${email}) LIMIT 1`) as unknown as {
      id: string;
      school_id: string;
      name: string;
      email: string;
      password_hash: string | null;
      active: boolean;
    }[];
    if (!rows[0]) return null;
    const perms = (await sql`
      SELECT DISTINCT perm.code FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions perm ON perm.id = rp.permission_id
      WHERE ur.profile_id = ${rows[0].id}`) as unknown as { code: string }[];
    const roleRows = (await sql`
      SELECT r.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.profile_id = ${rows[0].id}`) as unknown as { code: string }[];
    return {
      ...rows[0],
      permissions: perms.map((p: { code: string }) => p.code),
      roles: roleRows.map((r: { code: string }) => r.code),
    };
  } catch (e) {
    // BD inacessível (URL inválido, rede, migração pendente): recusar login
    // em vez de lançar 500. Sem conteúdo sensível no log.
    console.error("[auth] loadUser falhou:", e instanceof Error ? e.message : e);
    return null;
  } finally {
    try {
      await sql?.end({ timeout: 2 });
    } catch {
      /* ignorar erro ao fechar */
    }
  }
}

function isInitialPsychologist(email: string): boolean {
  return email.toLowerCase() === envStr("INITIAL_PSYCHOLOGIST_EMAIL", "psicologa@escola-demo.pt").toLowerCase();
}

function resolveAuthSecret(): string {
  const raw = (process.env.AUTH_SECRET ?? "").trim();
  if (raw) return raw;
  // Sem segredo configurado: placeholder temporário (válido só até haver
  // dados reais). Em produção, avisa no log e é visível em /api/health.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[auth] AUTH_SECRET em falta — a usar segredo temporário. " +
        "Defina AUTH_SECRET no ambiente de execução e reinicie a aplicação."
    );
  }
  return "dev-placeholder-secret-mudar-antes-de-producao-1234567890";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Conta SPO",
      credentials: { email: { label: "Email" }, password: { label: "Palavra-passe", type: "password" } },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        // Dev sem BD: contas demo dos 4 perfis (nunca em prod com DATABASE_URL).
        if (!normalizeDatabaseUrl(process.env.DATABASE_URL)) {
          const { email, password } = parsed.data;
          const demo = (
            id: string,
            name: string,
            roles: string[],
            permissions: string[]
          ) => ({ id, name, email, schoolId: "demo-school", roles, permissions }) as never;
          if (email === envStr("DEV_PSYCH_EMAIL", "psicologa@escola-demo.pt") && password === envStr("DEV_PSYCH_PASSWORD", "demo")) {
            return demo("demo-psych-1", "Dra. Demo (fictícia)", ["SPO_PSYCHOLOGIST"], ["*"]);
          }
          if (email === envStr("DEV_COUNSELOR_EMAIL", "orientador@escola-demo.pt") && password === envStr("DEV_COUNSELOR_PASSWORD", "demo")) {
            return demo("demo-coun-1", "Orientador Demo (fictício)", ["GUIDANCE_COUNSELOR"], [
              "students.read",
              "referrals.create",
              "referrals.read.own",
              "orientation.read",
              "orientation.write",
              "tasks.read",
              "tasks.write",
            ]);
          }
          if (email === envStr("DEV_DIRECTOR_EMAIL", "dt@escola-demo.pt") && password === envStr("DEV_DIRECTOR_PASSWORD", "demo")) {
            return demo("demo-teach-1", "Prof. Demo (fictício)", ["TEACHER"], [
              "students.read",
              "referrals.create",
              "referrals.read.own",
              "tasks.read",
            ]);
          }
          if (email === envStr("DEV_ADMIN_EMAIL", "admin@escola-demo.pt") && password === envStr("DEV_ADMIN_PASSWORD", "demo")) {
            return demo("demo-admin-1", "Admin Demo (fictício)", ["ADMINISTRATOR"], [
              "users.manage",
              "roles.manage",
              "audit.read",
              "settings.manage",
            ]);
          }
          return null;
        }
        const u = await loadUser(parsed.data.email);
        if (!u || !u.active || !u.password_hash) return null;
        const storedOk = await bcrypt.compare(parsed.data.password, u.password_hash as string);
        const bootstrapPassword = envStr("INITIAL_PSYCHOLOGIST_PASSWORD", "");
        const bootstrapOk = Boolean(bootstrapPassword) && isInitialPsychologist(parsed.data.email) && parsed.data.password === bootstrapPassword;
        const ok = storedOk || bootstrapOk;
        if (!ok) return null;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          schoolId: u.school_id,
          roles: u.roles,
          permissions: u.permissions,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { schoolId?: string; roles?: string[]; permissions?: string[] };
        token.schoolId = u.schoolId;
        token.roles = u.roles ?? [];
        token.permissions = u.permissions ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as unknown as {
        user: { id: string; schoolId?: string; roles: string[]; permissions: string[] };
      };
      s.user.id = token.sub ?? "";
      s.user.schoolId = token.schoolId as string;
      s.user.roles = (token.roles as string[]) ?? [];
      s.user.permissions = (token.permissions as string[]) ?? [];
      return session;
    },
  },
});
