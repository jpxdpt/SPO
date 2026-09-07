import { requirePsych } from "@/lib/session";
import { listAppointments } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requirePsych();
  const appointments = await listAppointments(user);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calendário</h1>
      <p className="text-sm text-slate-500">Vista diária, semanal e mensal. Cores por tipo; filtros por psicóloga, turma e sala. Sem detalhe clínico na grelha partilhada.</p>
      <Card><CardHeader><CardTitle>Hoje</CardTitle></CardHeader>
        <CardContent>{appointments.length === 0 ? <p className="text-sm text-slate-500">Sem atendimentos agendados.</p> : <div className="space-y-2">{appointments.map((appointment) => <div key={appointment.id} className="rounded border p-3 text-sm"><p className="font-medium">{appointment.studentName} · {appointment.type}</p><p className="text-xs text-slate-500">{new Date(appointment.startsAt).toLocaleString("pt-PT")}–{new Date(appointment.endsAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} · {appointment.status}{appointment.room ? ` · ${appointment.room}` : ""}</p></div>)}</div>}</CardContent></Card>
    </div>
  );
}
