import { requireUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tarefas</h1>
      <p className="text-sm text-slate-500">Responsável, prazo, prioridade, estado e ligação opcional a um caso.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Nova tarefa</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-3" action="#">
              <div><Label htmlFor="title">Título</Label><Input id="title" name="title" required minLength={3} /></div>
              <Button type="submit" variant="secondary">Criar (liga ao Neon)</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Minhas tarefas</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-500">Sem tarefas. Ligue o Neon para sincronizar.</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
