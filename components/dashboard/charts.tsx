"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const weekly = [
  { dia: "2.ª", atendimentos: 4, sinalizacoes: 2 },
  { dia: "3.ª", atendimentos: 6, sinalizacoes: 3 },
  { dia: "4.ª", atendimentos: 5, sinalizacoes: 1 },
  { dia: "5.ª", atendimentos: 7, sinalizacoes: 4 },
  { dia: "6.ª", atendimentos: 3, sinalizacoes: 2 },
];

const reasons = [
  { motivo: "Bem-estar", n: 12 },
  { motivo: "Absentismo", n: 8 },
  { motivo: "Aprendizagem", n: 9 },
  { motivo: "Vocacional", n: 6 },
  { motivo: "Outros", n: 5 },
];

export function ActivityChart() {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={weekly}>
          <XAxis dataKey="dia" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="atendimentos" fill="#1e3a5f" name="Atendimentos" />
          <Bar dataKey="sinalizacoes" fill="#94a3b8" name="Sinalizações" />
        </BarChart>
      </ResponsiveContainer>
      <table className="mt-2 w-full text-xs text-slate-500">
        <caption className="text-left font-medium text-slate-700">Resumo textual da atividade semanal</caption>
        <tbody>
          {weekly.map((w) => (
            <tr key={w.dia} className="border-t">
              <td className="py-1">{w.dia}</td>
              <td>{w.atendimentos} atendimentos</td>
              <td>{w.sinalizacoes} sinalizações</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReasonsChart() {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={reasons} layout="vertical">
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="motivo" type="category" width={90} />
          <Tooltip />
          <Bar dataKey="n" fill="#1e40af" name="Casos" />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-slate-500">Valores agregados; grupos inferiores a 5 são suprimidos em partilhas externas.</p>
    </div>
  );
}
