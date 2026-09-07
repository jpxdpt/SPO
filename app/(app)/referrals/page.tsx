import { requirePermission } from "@/lib/session";
import { PERMISSIONS, isPsychAdmin } from "@/lib/permissions";
import { hasDatabaseUrl } from "@/lib/db";
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
  const psych = isPsychAdmin(u.roles) || u.permissions.includes("*");

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
                <Input id="studentId" name="studentId" placeholder="ID do aluno — seletor ligado ao Neon" required />
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
            <p className="text-sm text-slate-500">
              {hasDatabaseUrl()
                ? psych
                  ? "Lista de sinalizações recebidas com ações de triagem (aceitar, pedir informação, encaminhar, encerrar)."
                  : "Data, aluno, categoria e estado seguro. Sem psicóloga responsável, decisão clínica ou notas internas."
                : "Ligue o Neon para ver a lista."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
