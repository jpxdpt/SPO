import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";
import { createManagedUser } from "@/app/(app)/operational-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePermission(PERMISSIONS.USERS_MANAGE);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administração</h1>
      <p className="text-sm text-slate-500">
        Utilizadores, papéis, turmas, cursos, anos letivos e auditoria. Exclusivo do administrador técnico —
        esta área não dá acesso a conteúdo psicológico confidencial. Alterações de permissões geram evento auditado.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Criar utilizador</CardTitle></CardHeader>
          <CardContent><form action={async (formData) => { "use server"; await createManagedUser(formData); }} className="space-y-3">
            <input name="name" required minLength={3} placeholder="Nome completo" className="h-10 w-full rounded-lg border px-3" />
            <input name="email" required type="email" placeholder="Email institucional" className="h-10 w-full rounded-lg border px-3" />
            <input name="password" required minLength={10} type="password" placeholder="Password inicial (mínimo 10 caracteres)" className="h-10 w-full rounded-lg border px-3" />
            <select name="roleCode" className="h-10 w-full rounded-lg border px-3"><option value="TEACHER">Professor/Docente</option><option value="GUIDANCE_COUNSELOR">Orientador/a Educacional</option><option value="SPO_PSYCHOLOGIST">Psicólogo/a SPO</option><option value="ADMINISTRATOR">Administrador</option></select>
            <button type="submit" className="h-10 rounded-lg bg-blue-800 px-4 text-sm font-medium text-white hover:bg-blue-900">Criar utilizador</button>
          </form></CardContent></Card>
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
