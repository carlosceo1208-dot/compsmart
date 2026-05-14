import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import { exportDashboardToPDF } from '@/lib/pdfDashboardExport';
import { INSTRUMENTOS, CATEGORIA_LABEL } from '@/lib/fib';
import { useFibData } from '@/hooks/useNr1Cycles';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts';

const ciclos = [
  { nome: 'Colaborador', cor: 'hsl(var(--nr1-primary))' },
  { nome: 'Empresa', cor: 'hsl(var(--nr1-success))' },
];

// Correlação dos 13 fatores de risco psicossocial (NR-1) com as 9 dimensões FIB
type Correlacao = { perigo: string; dimensoes: string[]; nota: string };
const CORRELACAO_FATORES_FIB: Correlacao[] = [
  { perigo: 'Assédio de qualquer natureza no trabalho', dimensoes: ['Cultura', 'Bem-Estar Psicológico'], nota: 'Erosão de respeito e segurança psíquica.' },
  { perigo: 'Má gestão de mudanças organizacionais', dimensoes: ['Governança', 'Bem-Estar Psicológico'], nota: 'Falta de transparência e participação.' },
  { perigo: 'Baixa clareza de papel/função', dimensoes: ['Governança', 'Educação'], nota: 'Ausência de descrição/competências claras.' },
  { perigo: 'Baixas recompensas e reconhecimento', dimensoes: ['Padrão de Vida', 'Cultura'], nota: 'Desequilíbrio esforço–recompensa.' },
  { perigo: 'Falta de suporte/apoio no trabalho', dimensoes: ['Vitalidade Comunitária', 'Cultura'], nota: 'Apoio social de pares e líder.' },
  { perigo: 'Baixo controle no trabalho / Falta de autonomia', dimensoes: ['Governança', 'Bem-Estar Psicológico'], nota: 'Estudo Whitehall: autonomia protege saúde.' },
  { perigo: 'Baixa justiça organizacional', dimensoes: ['Governança', 'Cultura'], nota: 'Equidade procedimental e distributiva.' },
  { perigo: 'Eventos violentos ou traumáticos', dimensoes: ['Saúde', 'Bem-Estar Psicológico'], nota: 'Demanda cuidado clínico (SRQ-20/DASS-21).' },
  { perigo: 'Baixa demanda no trabalho (subcarga)', dimensoes: ['Uso do Tempo', 'Educação'], nota: 'Subutilização de competências.' },
  { perigo: 'Excesso de demandas no trabalho (sobrecarga)', dimensoes: ['Uso do Tempo', 'Saúde'], nota: 'Burnout e DORT por jornada/ritmo.' },
  { perigo: 'Maus relacionamentos no local de trabalho', dimensoes: ['Vitalidade Comunitária', 'Cultura'], nota: 'Conflitos crônicos não mediados.' },
  { perigo: 'Trabalho em condições de difícil comunicação', dimensoes: ['Governança', 'Vitalidade Comunitária'], nota: 'Ruído de canais e feedback.' },
  { perigo: 'Trabalho remoto e isolado', dimensoes: ['Vitalidade Comunitária', 'Meio Ambiente'], nota: 'Isolamento social e ergonomia do posto.' },
];

// Correlação dos 13 fatores de risco psicossocial (NR-1) com as 6 dimensões do questionário (COPSOQ-III adaptado, 40 perguntas)
type CorrelacaoCopsoq = { perigo: string; dimensoes: string[]; nota: string };
const CORRELACAO_FATORES_COPSOQ: CorrelacaoCopsoq[] = [
  { perigo: 'Assédio de qualquer natureza no trabalho', dimensoes: ['Relações e Liderança', 'Saúde e Bem-Estar'], nota: 'Itens de respeito, conflito e sofrimento psíquico.' },
  { perigo: 'Má gestão de mudanças organizacionais', dimensoes: ['Organização e Conteúdo', 'Valores no Trabalho'], nota: 'Previsibilidade, comunicação e confiança institucional.' },
  { perigo: 'Baixa clareza de papel/função', dimensoes: ['Organização e Conteúdo'], nota: 'Itens de clareza de papel e previsibilidade.' },
  { perigo: 'Baixas recompensas e reconhecimento', dimensoes: ['Valores no Trabalho', 'Relações e Liderança'], nota: 'Reconhecimento e justiça (esforço × recompensa).' },
  { perigo: 'Falta de suporte/apoio no trabalho', dimensoes: ['Relações e Liderança'], nota: 'Apoio social do líder e dos pares.' },
  { perigo: 'Baixo controle no trabalho / Falta de autonomia', dimensoes: ['Organização e Conteúdo'], nota: 'Influência no trabalho e possibilidades de desenvolvimento.' },
  { perigo: 'Baixa justiça organizacional', dimensoes: ['Valores no Trabalho'], nota: 'Justiça procedimental, equidade e confiança vertical.' },
  { perigo: 'Eventos violentos ou traumáticos', dimensoes: ['Saúde e Bem-Estar', 'Relações e Liderança'], nota: 'Estresse, sintomas e segurança no ambiente.' },
  { perigo: 'Baixa demanda no trabalho (subcarga)', dimensoes: ['Demandas', 'Organização e Conteúdo'], nota: 'Subutilização de competências e tédio.' },
  { perigo: 'Excesso de demandas no trabalho (sobrecarga)', dimensoes: ['Demandas', 'Saúde e Bem-Estar'], nota: 'Demandas quantitativas, ritmo e exaustão.' },
  { perigo: 'Maus relacionamentos no local de trabalho', dimensoes: ['Relações e Liderança'], nota: 'Qualidade dos vínculos, conflitos e cooperação.' },
  { perigo: 'Trabalho em condições de difícil comunicação', dimensoes: ['Organização e Conteúdo', 'Relações e Liderança'], nota: 'Clareza de informação e canais de feedback.' },
  { perigo: 'Trabalho remoto e isolado', dimensoes: ['Interface Trabalho-Indivíduo', 'Relações e Liderança'], nota: 'Conflito trabalho–vida e isolamento social.' },
];

import { Nr1EmptyState, Nr1SeedAlert } from '@/components/nr1/Nr1EmptyState';
import { registrarAcessoNr1 } from '@/lib/nr1Privacy';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

export default function Nr1FIB() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useFibData();
  const { activeCompanyId } = useCompanyContext();
  const { data: roleInfo } = useCurrentUserRole();
  const actorRole = roleInfo?.isSuperAdmin ? 'super_admin' : roleInfo?.isAdmin ? 'admin' : roleInfo?.isHR ? 'hr_manager' : roleInfo?.isManager ? 'manager' : 'employee';

  if (isLoading || !data) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando ciclo FIB…</div>;
  }

  if (data.source === 'empty') {
    return (
      <Nr1EmptyState
        titulo="Nenhum ciclo FIB coletado ainda"
        descricao="Quando o primeiro ciclo de Bem-Estar Integral for aplicado e respondido pelos colaboradores, os resultados aparecerão aqui automaticamente."
      />
    );
  }

  const radarData = data.scores.map((s) => ({ dim: s.label, Colaborador: s.colaborador, Empresa: s.empresa }));
  const geralColab = Math.round(data.scores.reduce((a, b) => a + b.colaborador, 0) / (data.scores.length || 1));
  const geralEmpresa = Math.round(data.scores.reduce((a, b) => a + b.empresa, 0) / (data.scores.length || 1));
  const gap = geralEmpresa - geralColab;

  const exportarCSV = () => {
    if (activeCompanyId) {
      registrarAcessoNr1({ companyId: activeCompanyId, actorRole, action: 'export_csv', resource: 'fib' });
    }
    exportToCSV(
      'fib_bem_estar_integral',
      [
        { header: 'Dimensão', accessor: (r: any) => r.label },
        { header: 'Grupo', accessor: (r: any) => r.grupo === 'pessoa' ? 'Pessoa' : 'Organização' },
        { header: 'Colaborador (%)', accessor: (r: any) => r.colaborador },
        { header: 'Empresa (%)', accessor: (r: any) => r.empresa },
        { header: 'Δ', accessor: (r: any) => r.empresa - r.colaborador },
      ],
      data.scores,
    );
  };

  const exportarPDF = async () => {
    if (activeCompanyId) {
      registrarAcessoNr1({ companyId: activeCompanyId, actorRole, action: 'export_pdf', resource: 'fib' });
    }
    if (dashboardRef.current) {
      await exportDashboardToPDF(dashboardRef.current, {
        filename: 'fib_bem_estar_integral',
        title: 'Bem-Estar Integral (FIB)',
        subtitle: data.ciclo ?? 'Visão executiva',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Bem-Estar Integral (FIB)</h2>
          <p className="text-sm text-muted-foreground">
            Felicidade Interna Bruta — comparativo entre percepção do colaborador e condições oferecidas pela empresa nas 9 dimensões.
          </p>
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
        <div className="grid gap-4 md:grid-cols-3">
          <KpiBox label="Visão Colaborador" value={`${geralColab}%`} />
          <KpiBox label="Visão Empresa" value={`${geralEmpresa}%`} />
          <KpiBox label="Gap percepção" value={`${gap > 0 ? '+' : ''}${gap} pts`} hint={gap >= 0 ? 'Empresa entrega mais que percebido' : 'Colaborador percebe menos do que empresa entrega'} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Radar FIB — Colaborador vs. Empresa</CardTitle>
            <CardDescription>Pontuação 0–100 por dimensão.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Colaborador" dataKey="Colaborador" stroke={ciclos[0].cor} fill={ciclos[0].cor} fillOpacity={0.35} />
                  <Radar name="Empresa" dataKey="Empresa" stroke={ciclos[1].cor} fill={ciclos[1].cor} fillOpacity={0.25} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhe por dimensão</CardTitle>
            <CardDescription>Percentuais por questão, grupo e dimensão.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              {data.scores.map((s) => {
                const diff = s.empresa - s.colaborador;
                return (
                  <div key={s.key} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s.label}</span>
                      <Badge variant="outline" className="text-[10px]">{s.grupo === 'pessoa' ? 'Pessoa' : 'Organização'}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <Stat label="Colab." value={`${s.colaborador}%`} />
                      <Stat label="Empresa" value={`${s.empresa}%`} />
                      <Stat label="Δ" value={`${diff > 0 ? '+' : ''}${diff}`} tone={Math.abs(diff) > 10 ? 'warn' : 'ok'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Correlação — 13 Fatores de Risco NR-1 × Dimensões FIB</CardTitle>
            <CardDescription>
              Mapeamento de cada perigo psicossocial às dimensões de Bem-Estar Integral mais sensíveis.
              Use para priorizar ações: um fator alto deve elevar investimento nas dimensões correlatas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold w-[38%]">Fator de risco (NR-1)</th>
                    <th className="text-left px-3 py-2 font-semibold w-[32%]">Dimensões FIB impactadas</th>
                    <th className="text-left px-3 py-2 font-semibold">Por quê</th>
                  </tr>
                </thead>
                <tbody>
                  {CORRELACAO_FATORES_FIB.map((c, i) => (
                    <tr key={c.perigo} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                      <td className="px-3 py-2 align-top">{c.perigo}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-wrap gap-1">
                          {c.dimensoes.map((d) => (
                            <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-muted-foreground text-xs">{c.nota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Fonte: cruzamento entre os 13 perigos psicossociais da NR-1 (orientação técnica GRO/PGR) e as 9 dimensões
              do Bem-Estar Integral (FIB). Uma mesma dimensão pode receber sinal de múltiplos fatores — quanto mais
              perigos apontam para ela, maior a prioridade no plano de ação.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instrumentos da biblioteca</CardTitle>
            <CardDescription>Pesquisas e rastreadores disponíveis para compor o ciclo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {INSTRUMENTOS.map((i) => (
                <div key={i.key} className="flex items-start justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{i.nome}</p>
                    <p className="text-xs text-muted-foreground">{i.descricao}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{i.itens} itens · {i.duracao}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] whitespace-nowrap">{CATEGORIA_LABEL[i.categoria]}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card><CardContent className="pt-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </CardContent></Card>
  );
}

function Stat({ label, value, tone = 'ok' }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className={tone === 'warn' ? 'text-orange-600' : ''}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}
