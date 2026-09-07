import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Orientação escolar e profissional (Fase 3+).
 * Placeholder com controlo de acesso: psicólogos e orientadores.
 */
export default async function OrientationPage() {
  await requirePermission(PERMISSIONS.ORIENTATION_READ);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orientação escolar e profissional</h1>
      <p className="text-sm text-slate-500">
        Processos de orientação, sessões, objetivos e interesses, percursos escolares/profissionais,
        transições e encaminhamentos, atividades de orientação vocacional.
      </p>
      <Card>
        <CardHeader><CardTitle>Processos de orientação</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Módulo da Fase 3. O orientador consulta apenas a informação necessária à sua função — sem acesso a casos clínicos, notas ou avaliações psicológicas.</p>
        </CardContent>
      </Card>
    </div>
  );
}
