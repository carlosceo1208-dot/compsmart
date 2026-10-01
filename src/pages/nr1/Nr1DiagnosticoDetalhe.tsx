import { useParams } from 'react-router-dom';
import { useNr1Diagnostico } from '@/hooks/useNr1';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';
import { Nr1SeloSaude, Nr1SeloRodape } from '@/components/nr1/Nr1SeloSaude';
import { notaSaude, seloSaude } from '@/lib/nr1Selo';
import { Download, Users, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GerarPgrButton } from '@/components/nr1/GerarPgrButton';

export default function Nr1DiagnosticoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useNr1Diagnostico(id);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p className="text-center py-10 text-muted-foreground">Diagnóstico não encontrado.</p>;

  const scores = (data.scores_dimensao as Record<string, number> | null) ?? {};
  const dims = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  const baixaParticipacao = data.total_respondentes < 5;

  const exportar = () => {
    if (baixaParticipacao) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Diagnóstico NR-1 — ${data.ciclo_nome}`, 14, 18);
    doc.setFontSize(10);
    doc.text(
      `Risco: ${data.score_geral?.toFixed(1) ?? '—'} / 100 · Nota de saúde: ${
        notaSaude(data.score_geral)?.toFixed(1) ?? '—'
      } (${seloSaude(notaSaude(data.score_geral))?.label ?? '—'}) · Respondentes: ${data.total_respondentes} · Nota de saúde = 100 - risco psicossocial`,
      14, 26
    );
    autoTable(doc, {
      startY: 34,
      head: [['Dimensão Psicossocial', 'Score (0-100)']],
      body: dims.map(([dim, score]) => [DIMENSAO_LABEL[dim as Dimensao] ?? dim, Number(score).toFixed(2)]),
    });
    doc.save(`nr1-diagnostico-${data.ciclo_nome}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{data.ciclo_nome}</h2>
          <p className="text-sm text-muted-foreground">
            Período: {data.periodo_inicio} {data.periodo_fim ? `→ ${data.periodo_fim}` : '(em andamento)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportar} variant="outline" disabled={baixaParticipacao}>
            <Download className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          {!baixaParticipacao && <GerarPgrButton
            size="default"
            className="nr1-bg-primary"
            diagnostico={{
              ciclo_nome: data.ciclo_nome,
              periodo_inicio: data.periodo_inicio,
              periodo_fim: data.periodo_fim,
              score_geral: data.score_geral as number | null,
              nivel_risco: data.nivel_risco as string | null,
              scores_dimensao: data.scores_dimensao as Record<string, number> | null,
              total_respondentes: data.total_respondentes,
            }}
          />}
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Score Geral</p>
            <p className="text-3xl font-bold">{baixaParticipacao ? 'Dados insuficientes' : data.score_geral?.toFixed(1) ?? '—'}{!baixaParticipacao && <span className="text-base text-muted-foreground">/100</span>}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Selo (nota de saúde)</p>
            {!baixaParticipacao && data.score_geral != null ? (
              <div className="mt-1 space-y-1">
                <Nr1SeloSaude risco={data.score_geral} className="text-base" />
                <Nr1SeloRodape />
              </div>
            ) : <p className="text-muted-foreground">—</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Respondentes</p>
            <p className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-muted-foreground" />
              {data.total_respondentes}
            </p>
          </CardContent>
        </Card>
      </div>

      {baixaParticipacao && (
        <Card className="border-[hsl(var(--nr1-warning))]">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--nr1-warning))] flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Dados insuficientes:</strong> este ciclo ainda não atingiu o mínimo de 5 participantes.
              Nenhum score individual ou agregado será exibido até atingir esse limite.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scores por dimensão */}
      <Card>
        <CardHeader>
          <CardTitle>Scores por Dimensão Psicossocial</CardTitle>
          <CardDescription>Quanto maior o score, maior o risco identificado naquela dimensão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {baixaParticipacao ? (
            <p className="text-sm text-muted-foreground">Dados insuficientes para exibir resultados por dimensão.</p>
          ) : dims.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem respostas registradas.</p>
          ) : (
            dims.map(([dim, score]) => {
              const s = Number(score);
              return (
                <div key={dim} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{DIMENSAO_LABEL[dim as Dimensao] ?? dim}</span>
                    <span className="tabular-nums">
                      {s.toFixed(1)} —{' '}
                      <Nr1SeloSaude risco={s} mostrarNota={false} />
                    </span>
                  </div>
                  <Progress value={s} className="h-2" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
