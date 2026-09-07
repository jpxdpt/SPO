import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function loadUser(email: string) {
  if (!process.env.DATABASE_URL) return null;
  const postgres = (await import("postgres")).default;
  const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 2, prepare: false });
  try {
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
  } finally {
    await sql.end({ timeout: 2 });
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? "build-placeholder-mudar-em-producao-1234567890",
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Conta SPO",
      credentials: { email: { label: "Email" }, password: { label: "Palavra-passe", type: "password" } },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        // Dev sem BD: contas demo (nunca em prod com DATABASE_URL).
        if (!process.env.DATABASE_URL) {
          const { email, password } = parsed.data;
          if (email === (process.env.DEV_PSYCH_EMAIL ?? "psicologa@escola-demo.pt") && password === (process.env.DEV_PSYCH_PASSWORD ?? "demo")) {
            return {
              id: "demo-psych-1",
              name: "Dra. Demo (fictícia)",
              email,
              schoolId: "demo-school",
              roles: ["PSYCHOLOGIST_ADMIN"],
              permissions: ["*"],
            } as never;
          }
          if (email === (process.env.DEV_DIRECTOR_EMAIL ?? "dt@escola-demo.pt") && password === (process.env.DEV_DIRECTOR_PASSWORD ?? "demo")) {
            return {
              id: "demo-dir-1",
              name: "Prof. Demo (fictício)",
              email,
              schoolId: "demo-school",
              roles: ["CLASS_DIRECTOR"],
              permissions: ["students.read", "referrals.create", "referrals.read.own", "tasks.read"],
            } as never;
          }
          return null;
        }
        const u = await loadUser(parsed.data.email);
        if (!u || !u.active || !u.password_hash) return null;
        const ok = await bcrypt.compare(parsed.data.password, u.password_hash as string);
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
