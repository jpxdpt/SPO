import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Inbox,
  FolderKanban,
  CalendarDays,
  ListTodo,
  Settings,
  LogOut,
} from "lucide-react";
import { auth, signOut } from "@/auth";
import { isPsychAdmin } from "@/lib/permissions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: "all" },
  { href: "/students", label: "Alunos", icon: Users, roles: "all" },
  { href: "/referrals", label: "Sinalizações", icon: Inbox, roles: "all" },
  { href: "/cases", label: "Casos", icon: FolderKanban, roles: "psych" },
  { href: "/calendar", label: "Calendário", icon: CalendarDays, roles: "psych" },
  { href: "/tasks", label: "Tarefas", icon: ListTodo, roles: "all" },
  { href: "/settings", label: "Administração", icon: Settings, roles: "psych" },
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = (session as unknown as { user?: { id?: string; name?: string; roles?: string[] } } | null)?.user;
  if (!user?.id) redirect("/login");
  const psych = isPsychAdmin(user.roles ?? []) || (user.roles ?? []).length === 0;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-[#1e3a5f] text-white" aria-label="Navegação principal">
        <div className="px-5 pb-4 pt-6">
          <p className="text-lg font-bold">SPO Gestão</p>
          <p className="text-xs text-blue-200">Psicologia e Orientação</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.filter((n) => n.roles === "all" || psych).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
            >
              <n.icon aria-hidden size={18} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs">
          <p className="truncate font-medium">{user.name ?? "Utilizador"}</p>
          <p className="text-blue-200">{psych ? "Equipa SPO" : "Direção de turma"}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="mt-3 flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-white/10">
              <LogOut size={16} aria-hidden /> Terminar sessão
            </button>
          </form>
        </div>
      </aside>
      <div className="ml-60 flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
        <footer className="px-6 pb-4 text-xs text-slate-500">
          Uso interno da escola. Sem dados reais em demonstração. Em urgência: 112 / SNS 24 — esta app não é sistema de emergência.
        </footer>
      </div>
    </div>
  );
}
