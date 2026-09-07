import { requirePermission } from "@/lib/session";
import { PERMISSIONS, isPsychologist } from "@/lib/permissions";
import { hasDatabaseUrl } from "@/lib/db";
import { listReferrals, listStudents } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  ["bem_estar_emocional", "Bem-estar emocional"],
  ["absentismo", "Absentismo"],
  ["comportamento", "Comportamento"],
  ["dificuldades_aprendizagem", "Dificuldades de aprendizagem"],
  ["orientacao_vocacional", "Orientação vocacional"],
  ["integracao", "Integração"],
  ["situacao_familiar", "Situação familiar"],
  ["pedido_intervencao_turma", "Pedido de intervenção em turma"],
  ["outro", "Outro"],
] as const;

export default async function ReferralsPage() {
  const u = await requirePermission(PERMISSIONS.REFERRALS_CREATE);
  const psych = isPsychologist(u.roles) || u.permissions.includes("*");
  const [referrals, students] = await Promise.all([listReferrals(u), listStudents(u)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sinalizações</h1>
        <p className="text-sm text-slate-500">
          Alerta factual do diretor de turma e triagem SPO. Sem diagnósticos nem conteúdo clínico aqui.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Nova sinalização</CardTitle></CardHeader>
          <CardContent>
            <form
              action={async (formData: FormData) => {
                "use server";
                const { createReferral } = await import("./actions");
                await createReferral(formData);
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="studentId">Aluno (apenas da sua turma)</Label>
                <select id="studentId" name="studentId" required className="h-10 w-full rounded-[12px] border border-slate-300 bg-white px-3 text-sm">
                  <option value="">Selecionar aluno…</option>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.fullName} — {student.className}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select id="category" name="category" required className="h-10 w-full rounded-[12px] border border-slate-300 bg-white px-3 text-sm">
                  {CATEGORIES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="factualDescription">Descrição factual</Label>
                <Textarea id="factualDescription" name="factualDescription" required minLength={20} maxLength={4000}
                  placeholder="Factos observados, datas, contexto escolar. Sem interpretações clínicas." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="urgency">Urgência operacional</Label>
                  <select id="urgency" name="urgency" className="h-10 w-full rounded-[12px] border border-slate-300 bg-white px-3 text-sm">
                    <option value="normal">Normal</option>
                    <option value="prioritaria">Prioritária</option>
                    <option value="urgente_operacional">Urgente (operacional)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="contactForClarification">Contacto p/ esclarecimentos</Label>
                  <Input id="contactForClarification" name="contactForClarification" placeholder="Email ou extensão" />
                </div>
              </div>
              <Button type="submit">Submeter ao SPO</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{psych ? "Triagem SPO" : "As minhas sinalizações"}</CardTitle>
            {psych ? <Badge tone="info">equipa SPO</Badge> : <Badge>estados seguros</Badge>}
          </CardHeader>
          <CardContent>
            {!hasDatabaseUrl() ? <p className="text-sm text-slate-500">Ligue a base de dados para ver a lista.</p> : referrals.length === 0 ? <p className="text-sm text-slate-500">Ainda não existem sinalizações.</p> : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div key={referral.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><p className="font-medium">{referral.studentName}</p><p className="text-xs text-slate-500">{referral.category} · {referral.urgency}</p></div>
                      <Badge tone={referral.status === "SPO_ACOMPANHAMENTO" ? "success" : referral.status === "ENCERRADA" ? "default" : "warning"}>{referral.status}</Badge>
                    </div>
                    {psych ? (
                      <details className="mt-3 text-sm"><summary className="cursor-pointer font-medium text-blue-800">Abrir triagem</summary>
                        <form action={async (formData) => { "use server"; const { triageReferral } = await import("./actions"); await triageReferral(formData); }} className="mt-3 space-y-2">
                          <input type="hidden" name="referralId" value={referral.id} />
                          <select name="decision" className="h-9 w-full rounded-lg border px-2" defaultValue="accept"><option value="accept">Aceitar e criar caso</option><option value="request_info">Pedir informação</option><option value="forward">Encaminhar</option><option value="close">Não prosseguir / encerrar</option></select>
                          <input name="priority" className="h-9 w-full rounded-lg border px-2" placeholder="Prioridade: baixa, normal ou alta" defaultValue="normal" />
                          <textarea name="note" className="min-h-20 w-full rounded-lg border p-2" placeholder="Nota factual de triagem (equipa SPO)" />
                          <input name="safeResponseToReferrer" className="h-9 w-full rounded-lg border px-2" placeholder="Resposta factual opcional ao remetente" />
                          <Button type="submit" size="sm">Guardar triagem</Button>
                        </form>
                      </details>
                    ) : <p className="mt-2 text-xs text-slate-500">A equipa SPO gere esta sinalização. Não são apresentados detalhes clínicos.</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
