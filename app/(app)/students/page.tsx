import { requireUser } from "@/lib/session";
import { hasDatabaseUrl } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const { q } = await searchParams;
  void q;

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
          <p className="text-sm text-slate-500">
            {hasDatabaseUrl()
              ? "Sem resultados para os filtros indicados."
              : "Ligue a base de dados Neon para pesquisar alunos (seed fictício incluído em db/seed.ts)."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
