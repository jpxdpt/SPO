import { requirePsych } from "@/lib/session";
import { getCaseDetail } from "@/lib/data";
import { createAppointment, closeCase, updateAppointmentStatus } from "@/app/(app)/operational-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePsych();
  const { id } = await params;
  const detail = await getCaseDetail(user, id);
  if (!detail) return <p className="text-sm text-slate-500">Caso não encontrado.</p>;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Caso · {detail.case.studentName}</h1>
        <Badge tone="info">cronologia</Badge>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-4"><div><span className="text-slate-500">Estado</span><p className="font-medium">{detail.case.status}</p></div><div><span className="text-slate-500">Motivo</span><p className="font-medium">{detail.case.mainReason}</p></div><div><span className="text-slate-500">Prioridade</span><p className="font-medium">{detail.case.priority}</p></div><div><span className="text-slate-500">Aberto em</span><p className="font-medium">{new Date(detail.case.openedAt).toLocaleDateString("pt-PT")}</p></div></div>
      <Card>
        <CardHeader><CardTitle>Cronologia</CardTitle></CardHeader>
        <CardContent>{detail.events.length === 0 ? <p className="text-sm text-slate-500">Sem eventos.</p> : <ol className="space-y-3">{detail.events.map((event) => <li key={event.id} className="border-l-2 border-blue-200 pl-3"><p className="font-medium">{event.summary}</p><p className="text-xs text-slate-500">{event.eventType} · {new Date(event.occurredAt).toLocaleString("pt-PT")} · {event.visibility}</p></li>)}</ol>}</CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Agendar atendimento</CardTitle></CardHeader><CardContent><form action={async (formData) => { "use server"; await createAppointment(formData); }} className="space-y-2"><input type="hidden" name="caseId" value={id} /><select name="type" className="h-9 w-full rounded-lg border px-2"><option value="individual">Atendimento individual</option><option value="reuniao_ee">Reunião com EE</option><option value="intervencao_turma">Intervenção em turma</option></select><input name="startsAt" type="datetime-local" required className="h-9 w-full rounded-lg border px-2" /><input name="endsAt" type="datetime-local" required className="h-9 w-full rounded-lg border px-2" /><input name="room" placeholder="Sala" className="h-9 w-full rounded-lg border px-2" /><Button type="submit" size="sm">Agendar</Button></form></CardContent></Card>
        <Card><CardHeader><CardTitle>Atendimentos</CardTitle></CardHeader><CardContent>{detail.appointments.length === 0 ? <p className="text-sm text-slate-500">Sem atendimentos agendados.</p> : <div className="space-y-2">{detail.appointments.map((appointment) => <div key={appointment.id} className="flex items-center justify-between rounded border p-2 text-sm"><span>{appointment.type} · {new Date(appointment.startsAt).toLocaleString("pt-PT")}<br /><span className="text-xs text-slate-500">{appointment.status} {appointment.room ? `· ${appointment.room}` : ""}</span></span>{appointment.status === "SCHEDULED" && <form action={async (formData) => { "use server"; await updateAppointmentStatus(formData); }}><input type="hidden" name="appointmentId" value={appointment.id} /><input type="hidden" name="status" value="COMPLETED" /><Button size="sm" variant="secondary">Concluir</Button></form>}</div>)}</div>}</CardContent></Card>
      </div>
      {detail.case.status !== "ENCERRADO" && <Card><CardHeader><CardTitle>Encerrar caso</CardTitle></CardHeader><CardContent><form action={async (formData) => { "use server"; await closeCase(formData); }} className="space-y-2"><input type="hidden" name="caseId" value={id} /><input name="closeReason" required placeholder="Motivo de encerramento" className="h-9 w-full rounded-lg border px-2" /><textarea name="closeSummary" required placeholder="Resumo mínimo factual" className="min-h-20 w-full rounded-lg border p-2" /><Button type="submit" variant="secondary">Encerrar caso</Button></form></CardContent></Card>}
    </div>
  );
}
