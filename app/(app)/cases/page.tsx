import { requirePsych } from "@/lib/session";
import { listCases } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const user = await requirePsych();
  const cases = await listCases(user);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Casos e acompanhamentos</h1>
        <p className="text-sm text-slate-500">Exclusivo da equipa SPO. Diretores de turma não têm acesso a esta área.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Casos ativos</CardTitle></CardHeader>
        <CardContent>
          {cases.length === 0 ? <p className="text-sm text-slate-500">Ainda não existem casos.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-2">Aluno</th><th>Estado</th><th>Prioridade</th><th>Aberto em</th><th></th></tr></thead>
              <tbody>{cases.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="py-3 font-medium">{item.studentName}</td><td>{item.status}</td><td>{item.priority}</td><td>{new Date(item.openedAt).toLocaleDateString("pt-PT")}</td><td><a href={`/cases/${item.id}`} className="text-blue-800 hover:underline">Abrir</a></td></tr>)}</tbody>
            </table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
