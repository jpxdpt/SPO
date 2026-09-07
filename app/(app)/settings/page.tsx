import { requireAdmin } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administração</h1>
      <p className="text-sm text-slate-500">
        Utilizadores, papéis, turmas, cursos, anos letivos e auditoria. Exclusivo do administrador técnico —
        esta área não dá acesso a conteúdo psicológico confidencial. Alterações de permissões geram evento auditado.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Utilizadores e papéis</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-500">Criar/desativar utilizadores, definir perfis e permissões. Papéis personalizados começam sem permissões.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Turmas, cursos e anos letivos</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-500">Configuração da estrutura escolar e atribuições de docentes.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Auditoria</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-500">Criação, leitura de nota clínica, exportação, download e mudanças de permissões (metadados, sem conteúdo clínico).</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Parâmetros do sistema</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-500">Categorias, listas configuráveis, retenção e integrações.</p></CardContent></Card>
      </div>
    </div>
  );
}
