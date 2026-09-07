import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const TABS = ["Resumo", "Casos", "Agenda", "Documentos", "Histórico", "Auditoria"];

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.STUDENTS_READ);
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil do aluno</h1>
        <p className="text-sm text-slate-500">Identificação mínima, turma/ano e responsáveis. ID: {id}</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Separadores do perfil">
        {TABS.map((t) => (
          <span key={t} className="rounded-full bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">{t}</span>
        ))}
      </nav>
      <Card>
        <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Dados carregados após ligação à base de dados. Conteúdo clínico (notas, avaliações) nunca aparece aqui — pertence ao caso, com permissões reforçadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
