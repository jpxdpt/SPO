import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdministrator, isPsychologist } from "@/lib/permissions";
import { hasDatabaseUrl } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityChart, ReasonsChart } from "@/components/dashboard/charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const user = (session as unknown as { user?: { id?: string; roles?: string[]; permissions?: string[] } } | null)?.user;
  if (!user?.id) redirect("/login");
  const roles = user.roles ?? [];
  const wildcard = (user.permissions ?? []).includes("*");
  const psych = isPsychologist(roles) || wildcard;
  const admin = isAdministrator(roles);
  const noDb = !hasDatabaseUrl();

  if (admin && !psych) {
    // Dashboard do administrador técnico: gestão, sem conteúdo clínico.
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Administração</h1>
            <p className="text-sm text-slate-500">Gestão técnica da plataforma. Sem acesso a conteúdo psicológico.</p>
          </div>
          <Button asChild><Link href="/settings">Gerir plataforma</Link></Button>
        </div>
        {noDb && <DemoBanner />}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Indicadores técnicos">
          {[
            { label: "Utilizadores ativos", value: "—" },
            { label: "Papéis configurados", value: "4" },
            { label: "Turmas / anos letivos", value: "—" },
            { label: "Eventos de auditoria (7d)", value: "—" },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent>
                <p className="text-3xl font-bold">{k.value}</p>
                <p className="text-sm text-slate-500">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    );
  }

  if (!psych) {
    // Professor/Docente e Orientador: só as suas sinalizações + nova sinalização.
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">As minhas sinalizações</h1>
            <p className="text-sm text-slate-500">Estado seguro do acompanhamento pela equipa SPO.</p>
          </div>
          <Button asChild>
            <Link href="/referrals">Nova sinalização</Link>
          </Button>
        </div>
        {noDb && <DemoBanner />}
        <Card>
          <CardHeader>
            <CardTitle>Sinalizações submetidas por si</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Data</th>
                  <th>Aluno</th>
                  <th>Categoria</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-2">—</td>
                  <td colSpan={3} className="text-slate-500">
                    {noDb
                      ? "Ligue a base de dados Neon para ver as suas sinalizações."
                      : "Ainda não submeteu sinalizações."}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">
              «SPO_ACOMPANHAMENTO» significa apenas que a equipa recebeu e está a gerir a situação; não confirma diagnóstico, atendimento ou contacto com a família.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard SPO</h1>
          <p className="text-sm text-slate-500">Indicadores, agenda de hoje, pendentes e atividade.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link href="/referrals">Nova sinalização</Link></Button>
          <Button asChild><Link href="/cases">Novo atendimento</Link></Button>
        </div>
      </div>
      {noDb && <DemoBanner />}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Indicadores">
        {[
          { label: "Casos ativos", value: "—" },
          { label: "Sinalizações (mês)", value: "—" },
          { label: "Atendimentos concluídos", value: "—" },
          { label: "Tarefas vencidas", value: "—" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent>
              <p className="text-3xl font-bold">{k.value}</p>
              <p className="text-sm text-slate-500">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Hoje</CardTitle><Badge tone="info">agenda</Badge></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Sem eventos agendados. {noDb ? "Ligue o Neon para carregar a agenda." : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pendentes</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Triagens por decidir</li>
              <li>Avisos de privacidade por confirmar</li>
              <li>Tarefas vencidas</li>
            </ul>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Atividade semanal</CardTitle></CardHeader>
          <CardContent><ActivityChart /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Motivos (agregado)</CardTitle></CardHeader>
          <CardContent><ReasonsChart /></CardContent>
        </Card>
      </section>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="rounded-[12px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="status">
      Base de dados ainda não ligada (DATABASE_URL em falta). A mostrar estrutura com dados de demonstração. Forneça o URL do Neon para ativar dados reais.
    </div>
  );
}
