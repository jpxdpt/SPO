import { requirePsych } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePsych();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administração</h1>
      <p className="text-sm text-slate-500">Utilizadores, papéis, turmas, salas e auditoria. Alterações de permissões geram evento auditado.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Utilizadores e papéis</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-500">Gestão de contas e papéis personalizados (começam sem permissões).</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Auditoria</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-500">Criação, leitura de nota clínica, exportação, download e mudanças de permissões.</p></CardContent></Card>
      </div>
    </div>
  );
}
