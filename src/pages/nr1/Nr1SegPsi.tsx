import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { exportToCSV } from '@/lib/csvExport';
import { exportDashboardToPDF } from '@/lib/pdfDashboardExport';
import { useSegPsiData, useNr1Workforce } from '@/hooks/useNr1Cycles';
import { useNr1Diagnosticos } from '@/hooks/useNr1';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Nr1EmptyState, Nr1SeedAlert } from '@/components/nr1/Nr1EmptyState';
import { registrarAcessoNr1 } from '@/lib/nr1Privacy';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

const DIMENSOES_COPSOQ: { key: string; label: string; descricao: string }[] = [
  { key: 'demandas_trabalho', label: 'Demandas do Trabalho', descricao: 'Volume, ritmo, pressão de tempo, demandas emocionais e cognitivas.' },
  { key: 'organizacao_conteudo', label: 'Organização e Conteúdo', descricao: 'Autonomia, clareza de papel, previsibilidade, sentido do trabalho.' },
  { key: 'relacoes_lideranca', label: 'Relações & Liderança', descricao: 'Apoio do líder e dos pares, qualidade da liderança, feedback.' },
  { key: 'interface_trabalho_individuo', label: 'Interface Trabalho-Indivíduo', descricao: 'Conflito trabalho-família, insegurança no emprego.' },
  { key: 'valores_trabalho', label: 'Valores no Trabalho', descricao: 'Justiça organizacional, confiança, reconhecimento.' },
  { key: 'saude_bem_estar', label: 'Saúde & Bem-Estar', descricao: 'Estresse, burnout, sofrimento psíquico, segurança mental.' },
];

function corDimensao(score: number) {
  if (score >= 70) return 'hsl(var(--nr1-success))';
  if (score >= 55) return 'hsl(var(--nr1-primary))';
  return 'hsl(var(--nr1-danger))';
}

const cores: Record<string, string> = {
  incluir: 'hsl(var(--nr1-success))',
  aprender: 'hsl(var(--nr1-primary))',
  contribuir: 'hsl(var(--nr1-primary))',
  desafiar: 'hsl(var(--nr1-danger))',
};

function tom(score: number) {
  if (score >= 70) return { label: 'Saudável', cls: 'bg-green-100 text-green-800' };
  if (score >= 55) return { label: 'Atenção', cls: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Crítico', cls: 'bg-orange-100 text-orange-800' };
}

export default function Nr1SegPsi() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useSegPsiData();
  const { data: workforce = 0 } = useNr1Workforce();
  const { data: diagnosticos } = useNr1Diagnosticos();
  const { activeCompanyId } = useCompanyContext();
  const { data: roleInfo } = useCurrentUserRole();
  const actorRole = roleInfo?.isSuperAdmin ? 'super_admin' : roleInfo?.isAdmin ? 'admin' : roleInfo?.isHR ? 'hr_manager' : roleInfo?.isManager ? 'manager' : 'employee';

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

  const exportarCSV = () => {
    if (activeCompanyId) {
      registrarAcessoNr1({ companyId: activeCompanyId, actorRole, action: 'export_csv', resource: 'segpsi' });
    }
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
  };

  const exportarPDF = async () => {
    if (activeCompanyId) {
      registrarAcessoNr1({ companyId: activeCompanyId, actorRole, action: 'export_pdf', resource: 'segpsi' });
    }
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


        {(() => {
          const ultimo = diagnosticos?.find((d) => d.status === 'concluido');
          const scoresDim = (ultimo?.scores_dimensao as Record<string, number> | null) ?? null;
          const dadosDim = DIMENSOES_COPSOQ.map((d) => ({
            ...d,
            score: scoresDim ? Number(scoresDim[d.key] ?? 0) : 0,
          }));
          const temDados = scoresDim && dadosDim.some((d) => d.score > 0);
          return (
            <Card>
              <CardHeader>
                <CardTitle>Score por dimensão COPSOQ-III</CardTitle>
                <CardDescription>
                  6 dimensões psicossociais (0–100) — base do diagnóstico NR-1 e da Matriz de Risco.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!temDados ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhum diagnóstico NR-1 concluído ainda. Aplique a Pesquisa Saúde Bem-Estar para visualizar.
                  </p>
                ) : (
                  <>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosDim} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={70} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            formatter={(v: number) => [`${v.toFixed(1)} / 100`, 'Score']}
                            labelFormatter={(l) => l}
                          />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                            {dadosDim.map((d) => (
                              <Cell key={d.key} fill={corDimensao(d.score)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 mt-4">
                      {dadosDim.map((d) => {
                        const t = tom(d.score);
                        return (
                          <div key={d.key} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border/50">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{d.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{d.descricao}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-semibold tabular-nums">{d.score.toFixed(1)}</span>
                              <Badge className={t.cls}>{t.label}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </div>
  );
}
