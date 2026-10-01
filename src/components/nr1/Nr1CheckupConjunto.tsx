import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleGate } from '@/components/ModuleGate';
import { statusSegPsi } from '@/lib/nr1SegPsi';
import { Download, Link2, Users } from 'lucide-react';

type Agregado = {
  acesso: string;
  motivo?: string;
  empresa?: { dados_suficientes: boolean; pessoas?: number; score?: number };
  areas?: { area: string; tipo?: 'area' | 'grupo'; pessoas: number; score: number }[];
  areas_ocultas?: number;
  sem_area?: number | null;
  sem_recorte?: number | null;
  tendencia?: { semana: string; score: number; pessoas: number }[];
};

const Selo = ({ score }: { score: number }) => {
  const s = statusSegPsi(score);
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

/** Visão de conjunto do check-up semanal: só agregados, k=5 por área e empresa. */
export function Nr1CheckupConjunto() {
  const { data, isLoading } = useQuery({
    queryKey: ['nr1-checkup-agregado'],
    queryFn: async () => {
      const { data: companyId } = await supabase.rpc('get_user_company_id');
      if (!companyId) return null;
      const { data, error } = await supabase.rpc('nr1_checkup_agregado' as any, { p_company: companyId, p_dias: 84 });
      if (error) throw error;
      return data as unknown as Agregado;
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data || data.acesso !== 'empresa') return null;

  const emp = data.empresa;
  const suficiente = !!emp?.dados_suficientes;

  const exportar = () => {
    const linhas = [['Recorte', 'Pessoas', 'Nota 0-100', 'Status']];
    if (suficiente && emp?.score != null) linhas.push(['Empresa', String(emp.pessoas), String(emp.score), statusSegPsi(emp.score).label]);
    (data.areas ?? []).forEach((a) => linhas.push([a.area, String(a.pessoas), String(a.score), statusSegPsi(a.score).label]));
    linhas.push([]);
    linhas.push(['Nota: somente agregados com no mínimo 5 pessoas (k=5). Áreas com menos de 5 pessoas são omitidas.']);
    const csv = linhas.map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'checkup-semanal-agregado.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 nr1-text-primary" /> Visão de conjunto (RH)</CardTitle>
          <CardDescription>Últimas 12 semanas. Só médias de grupos com 5 pessoas ou mais; ninguém é identificado.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportar} disabled={!suficiente}>
          <Download className="h-4 w-4 mr-2" /> Exportar agregado
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {!suficiente ? (
          <p className="text-sm text-muted-foreground">Dados insuficientes: menos de 5 pessoas fizeram check-up no período.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-bold">{emp!.score}</span>
              <span className="text-sm text-muted-foreground">/ 100 · empresa · {emp!.pessoas} pessoas</span>
              <Selo score={emp!.score!} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Por área</p>
              {(data.areas ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma área com 5 pessoas ou mais.</p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {data.areas!.map((a) => (
                    <div key={`${a.tipo}-${a.area}`} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="shrink-0">{a.tipo === 'grupo' ? 'Grupo' : 'Área'}</Badge>
                        <span className="font-medium truncate">{a.area}</span>
                      </span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="text-muted-foreground">{a.pessoas} pessoas</span>
                        <span className="font-semibold">{a.score}</span>
                        <Selo score={a.score} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {!!data.areas_ocultas && (
                <p className="text-xs text-muted-foreground">{data.areas_ocultas} recorte(s) oculto(s) por ter menos de 5 pessoas.</p>
              )}
              {!!data.sem_recorte && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3 text-sm">
                  <span className="font-medium">Sem recorte — média da empresa</span>
                  <span className="text-muted-foreground shrink-0">{data.sem_recorte} pessoa(s)</span>
                </div>
              )}
              {!!data.sem_recorte && (
                <p className="text-xs text-muted-foreground">
                  Quem não tem área no cadastro nem grupo escolhido entra só na média da empresa. Preencha a área para ter o recorte.
                </p>
              )}
            </div>

            {(data.tendencia ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Tendência semanal</p>
                <div className="flex flex-wrap gap-2">
                  {data.tendencia!.map((t) => (
                    <div key={t.semana} className="rounded-md border px-2 py-1 text-xs">
                      {new Date(t.semana + 'T00:00:00').toLocaleDateString('pt-BR')}: <strong>{t.score}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <ModuleGate
          moduleSlug="clima"
          mode="section"
          featureName="Correlação com o Clima Organizacional"
          description="Cruze o check-up semanal com eNPS e engajamento. Disponível para empresas com o Clima Organizacional contratado."
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Compare o check-up com o eNPS e o engajamento do Clima.</p>
            <Button asChild variant="outline" size="sm"><Link to="/clima/correlacao"><Link2 className="h-4 w-4 mr-2" />Abrir correlação</Link></Button>
          </div>
        </ModuleGate>
      </CardContent>
    </Card>
  );
}
