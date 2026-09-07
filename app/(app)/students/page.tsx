import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";
import { listStudents } from "@/lib/data";
import { hasDatabaseUrl } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePermission(PERMISSIONS.STUDENTS_READ);
  const { q } = await searchParams;
  const students = await listStudents(user, q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alunos</h1>
        <p className="text-sm text-slate-500">
          Pesquisa por nome, número, turma e estado. Diretores de turma veem apenas as suas turmas.
        </p>
      </div>
      <Card>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" action="/students">
            <div className="min-w-60 flex-1">
              <Label htmlFor="q">Pesquisar</Label>
              <Input id="q" name="q" placeholder="Nome, número ou turma…" defaultValue={q ?? ""} />
            </div>
            <Button type="submit" variant="secondary">Pesquisar</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
        <CardContent>
          {!hasDatabaseUrl() ? (
            <p className="text-sm text-slate-500">Ligue a base de dados Neon para pesquisar alunos.</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500">Sem resultados para os filtros indicados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-2">Número</th><th>Nome</th><th>Turma</th><th>Estado</th></tr></thead>
                <tbody>{students.map((student) => (
                  <tr key={student.id} className="border-b last:border-0">
                    <td className="py-3">{student.studentNumber}</td>
                    <td><a className="font-medium text-blue-800 hover:underline" href={`/students/${student.id}`}>{student.fullName}</a></td>
                    <td>{student.className}</td>
                    <td>{student.active ? "Ativo" : "Inativo"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
