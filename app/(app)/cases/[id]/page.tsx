import { requirePsych } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePsych();
  const { id } = await params;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Caso</h1>
        <Badge tone="info">cronologia</Badge>
      </div>
      <p className="text-sm text-slate-500">ID: {id}. Cabeçalho (estado, aluno, responsável, equipa, motivo, datas, prioridade, próxima revisão) + cronologia com visibilidade por entrada (TEAM / PSYCHOLOGIST_ONLY / COORDINATOR_ONLY). Nota detalhada em tabela separada e cifrada.</p>
      <Card>
        <CardHeader><CardTitle>Cronologia</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-slate-500">Triagem, atendimentos, avaliações, contactos, reuniões, documentos, tarefas, encaminhamentos e encerramento.</p></CardContent>
      </Card>
    </div>
  );
}
