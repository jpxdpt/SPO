import { requirePsych } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requirePsych();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calendário</h1>
      <p className="text-sm text-slate-500">Vista diária, semanal e mensal. Cores por tipo; filtros por psicóloga, turma e sala. Sem detalhe clínico na grelha partilhada.</p>
      <Card><CardHeader><CardTitle>Hoje</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-slate-500">Ligue o Neon para carregar atendimentos e reuniões.</p></CardContent></Card>
    </div>
  );
}
