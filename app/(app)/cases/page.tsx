import { requirePsych } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  await requirePsych();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Casos e acompanhamentos</h1>
        <p className="text-sm text-slate-500">Exclusivo da equipa SPO. Diretores de turma não têm acesso a esta área.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Casos ativos</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Ligue o Neon para listar casos (estado, responsável, próxima revisão).</p>
        </CardContent>
      </Card>
    </div>
  );
}
