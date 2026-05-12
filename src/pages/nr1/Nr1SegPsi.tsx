import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { exportToCSV } from '@/lib/csvExport';
import { ESTAGIOS_SEG_PSI } from '@/lib/fib';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';

const dados = [
  { key: 'incluir', score: 71.4 },
  { key: 'aprender', score: 65.1 },
  { key: 'contribuir', score: 65.1 },
  { key: 'desafiar', score: 40.5 },
];

const cores: Record<string, string> = {
  incluir: 'hsl(var(--nr1-success))',
  aprender: 'hsl(var(--nr1-primary))',
  contribuir: 'hsl(var(--nr1-primary))',
  desafiar: 'hsl(var(--nr1-danger))',
};

function tom(score: number) {
  if (score >= 70) return { label: 'Saudável', cls: 'bg-green-100 text-green-800' };
  if (score >= 55) return { label: 'Atenção', cls: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Crítico', cls: 'bg-red-100 text-red-800' };
}

export default function Nr1SegPsi() {
  const geral = (dados.reduce((a, b) => a + b.score, 0) / dados.length).toFixed(2);
  const chart = dados.map((d) => ({ ...d, label: ESTAGIOS_SEG_PSI.find((e) => e.key === d.key)!.label }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Segurança Psicológica — Visão Executiva</h2>
          <p className="text-sm text-muted-foreground">
            Modelo dos 4 estágios: Incluir, Aprender, Contribuir e Desafiar.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportToCSV(
              'seguranca_psicologica',
              [
                { header: 'Estágio', accessor: (r: any) => r.label },
                { header: 'Score (0-100)', accessor: (r: any) => r.score },
                { header: 'Classificação', accessor: (r: any) => tom(r.score).label },
                { header: 'Descrição', accessor: (r: any) => ESTAGIOS_SEG_PSI.find((e) => e.key === r.key)?.descricao ?? '' },
              ],
              chart,
            )
          }
        >
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">Respondentes</p>
          <p className="text-2xl font-semibold">1.626</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">Adesão</p>
          <p className="text-2xl font-semibold">60,53%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">Score geral</p>
          <p className="text-2xl font-semibold">{geral}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">Estágio mais frágil</p>
          <p className="text-2xl font-semibold">Desafiar</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score por estágio</CardTitle>
          <CardDescription>Pontuação 0–100 — escala normalizada.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score">
                  {chart.map((d) => <Cell key={d.key} fill={cores[d.key]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {dados.map((d) => {
          const e = ESTAGIOS_SEG_PSI.find((x) => x.key === d.key)!;
          const t = tom(d.score);
          return (
            <Card key={d.key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{e.label}</p>
                    <p className="text-xs text-muted-foreground">{e.descricao}</p>
                  </div>
                  <Badge className={t.cls}>{t.label}</Badge>
                </div>
                <div className="mt-3">
                  <Progress value={d.score} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">{d.score.toFixed(1)} / 100</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
