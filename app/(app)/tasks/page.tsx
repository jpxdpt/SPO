import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";
import { listTasks } from "@/lib/data";
import { createTask, completeTask } from "@/app/(app)/operational-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requirePermission(PERMISSIONS.TASKS_READ);
  const tasks = await listTasks(user);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tarefas</h1>
      <p className="text-sm text-slate-500">Responsável, prazo, prioridade, estado e ligação opcional a um caso.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Nova tarefa</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-3" action={async (formData) => { "use server"; await createTask(formData); }}>
              <div><Label htmlFor="title">Título</Label><Input id="title" name="title" required minLength={3} /></div>
              <div><Label htmlFor="dueAt">Prazo</Label><Input id="dueAt" name="dueAt" type="datetime-local" /></div>
              <div><Label htmlFor="priority">Prioridade</Label><select id="priority" name="priority" className="h-10 w-full rounded-lg border px-3"><option value="normal">Normal</option><option value="alta">Alta</option><option value="baixa">Baixa</option></select></div>
              <Button type="submit" variant="secondary">Criar tarefa</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Minhas tarefas</CardTitle></CardHeader>
          <CardContent>{tasks.length === 0 ? <p className="text-sm text-slate-500">Sem tarefas.</p> : <div className="space-y-2">{tasks.map((task) => <div key={task.id} className="flex items-center justify-between rounded border p-3 text-sm"><span><span className="font-medium">{task.title}</span><br /><span className="text-xs text-slate-500">{task.priority} · {task.dueAt ? new Date(task.dueAt).toLocaleString("pt-PT") : "Sem prazo"} · {task.status}</span></span>{task.status !== "CONCLUIDA" && <form action={async (formData) => { "use server"; await completeTask(formData); }}><input type="hidden" name="taskId" value={task.id} /><Button size="sm" variant="secondary">Concluir</Button></form>}</div>)}</div>}</CardContent>
        </Card>
      </div>
    </div>
  );
}
