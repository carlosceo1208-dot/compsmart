import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { exportToCSV } from '@/lib/csvExport';
import { exportDashboardToPDF } from '@/lib/pdfDashboardExport';
import { useSegPsiData, useNr1Workforce } from '@/hooks/useNr1Cycles';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Nr1EmptyState, Nr1SeedAlert } from '@/components/nr1/Nr1EmptyState';
import { registrarAcessoNr1 } from '@/lib/nr1Privacy';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

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
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useSegPsiData();
  const { data: workforce = 0 } = useNr1Workforce();

  if (isLoading || !data) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando dados…</div>;
  }

  if (data.source === 'empty') {
    return (
      <Nr1EmptyState
        titulo="Nenhum ciclo de Segurança Psicológica coletado"
        descricao="Quando o primeiro ciclo for aplicado e respondido pelos colaboradores, os scores dos 4 estágios aparecerão aqui automaticamente."
      />
    );
  }

  const geral = (data.scores.reduce((a, b) => a + b.score, 0) / (data.scores.length || 1)).toFixed(2);
  const fragil = [...data.scores].sort((a, b) => a.score - b.score)[0];

  const exportarCSV = () =>
    exportToCSV(
      'seguranca_psicologica',
      [
        { header: 'Estágio', accessor: (r: any) => r.label },
        { header: 'Score (0-100)', accessor: (r: any) => r.score },
        { header: 'Classificação', accessor: (r: any) => tom(r.score).label },
        { header: 'Descrição', accessor: (r: any) => r.descricao },
      ],
      data.scores,
    );

  const exportarPDF = async () => {
    if (dashboardRef.current) {
      await exportDashboardToPDF(dashboardRef.current, {
        filename: 'seguranca_psicologica',
        title: 'Segurança Psicológica — Visão Executiva',
        subtitle: data.ciclo ?? '4 estágios (T. Clark)',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Segurança Psicológica — Visão Executiva</h2>
          <p className="text-sm text-muted-foreground">Modelo dos 4 estágios: Incluir, Aprender, Contribuir e Desafiar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportarPDF}>
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>
      {data.source === 'seed' && <Nr1SeedAlert />}

      <div ref={dashboardRef} className="space-y-6 bg-background p-1">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Respondentes</p>
            <p className="text-2xl font-semibold">
              {data.respondentes.toLocaleString('pt-BR')}
              <span className="text-sm text-muted-foreground font-normal"> / {workforce}</span>
            </p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Adesão</p>
            <p className="text-2xl font-semibold">
              {workforce > 0 ? ((data.respondentes / workforce) * 100).toFixed(1) : '0,0'}%
            </p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Score geral</p>
            <p className="text-2xl font-semibold">{geral}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Estágio mais frágil</p>
            <p className="text-2xl font-semibold">{fragil?.label ?? '—'}</p>
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
                <BarChart data={data.scores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score">
                    {data.scores.map((d) => <Cell key={d.key} fill={cores[d.key] ?? 'hsl(var(--nr1-primary))'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-2">
          {data.scores.map((d) => {
            const t = tom(d.score);
            return (
              <Card key={d.key}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.descricao}</p>
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
    </div>
  );
}
