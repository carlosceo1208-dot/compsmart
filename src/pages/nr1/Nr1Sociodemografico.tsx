import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2, X } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import { exportDashboardToPDF } from '@/lib/pdfDashboardExport';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSociodemoData } from '@/hooks/useNr1Cycles';
import { Nr1EmptyState, Nr1SeedAlert } from '@/components/nr1/Nr1EmptyState';
import { aplicarKAnonimato, K_ANONIMATO_MINIMO } from '@/lib/nr1Privacy';

const INDICADORES = [
  { key: 'fib', label: 'FIB' },
  { key: 'segPsi', label: 'Seg. Psi.' },
  { key: 'hse', label: 'HSE' },
] as const;

function corCelula(v: number) {
  if (v >= 70) return 'bg-green-100 text-green-900';
  if (v >= 60) return 'bg-yellow-100 text-yellow-900';
  if (v >= 50) return 'bg-orange-100 text-orange-900';
  return 'bg-red-100 text-red-900';
}

export default function Nr1Sociodemografico() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useSociodemoData();
  const RECORTES = data?.recortes ?? [];

  const [recortesAtivos, setRecortesAtivos] = useState<string[] | null>(null);
  const [indicadoresAtivos, setIndicadoresAtivos] = useState<string[]>(['fib', 'segPsi', 'hse']);
  const [segmentosSel, setSegmentosSel] = useState<Record<string, string[]>>({});

  const recortesAtivosFinal = recortesAtivos ?? RECORTES.map((r) => r.id);

  const recortesFiltrados = useMemo(() => {
    return RECORTES
      .filter((r) => recortesAtivosFinal.includes(r.id))
      .map((r) => {
        const sel = segmentosSel[r.id];
        const linhasBase = sel && sel.length > 0 ? r.linhas.filter((l) => sel.includes(l.rotulo)) : r.linhas;
        // K-anonimato: nunca exibir grupos com menos de K respondentes
        const { visiveis, suprimidas } = aplicarKAnonimato(linhasBase, K_ANONIMATO_MINIMO);
        return { ...r, linhas: visiveis, suprimidas };
      });
  }, [RECORTES, recortesAtivosFinal, segmentosSel]);

  if (isLoading || !data) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando dados…</div>;
  }

  if (data.source === 'empty') {
    return (
      <Nr1EmptyState
        titulo="Sem cruzamento sociodemográfico disponível"
        descricao="Os recortes por gênero, idade, área e tempo de casa aparecem aqui após a coleta do primeiro ciclo, respeitando o piso de k-anonimato (mínimo 5 respondentes por grupo)."
      />
    );
  }

  const exportarCSV = () => {
    const rows: any[] = [];
    recortesFiltrados.forEach((r) => {
      r.linhas.forEach((l) => {
        const row: any = { recorte: r.titulo, segmento: l.rotulo };
        indicadoresAtivos.forEach((k) => (row[k] = (l as any)[k]));
        rows.push(row);
      });
    });
    const cols = [
      { header: 'Recorte', accessor: (r: any) => r.recorte },
      { header: 'Segmento', accessor: (r: any) => r.segmento },
      ...INDICADORES.filter((i) => indicadoresAtivos.includes(i.key)).map((i) => ({
        header: i.label,
        accessor: (r: any) => r[i.key],
      })),
    ];
    exportToCSV('cruzamento_sociodemografico', cols, rows);
  };

  const exportarPDF = async () => {
    if (dashboardRef.current) {
      await exportDashboardToPDF(dashboardRef.current, {
        filename: 'cruzamento_sociodemografico',
        title: 'Cruzamento Sociodemográfico',
        subtitle: data.ciclo ?? 'Heatmap consolidado',
      });
    }
  };

  const toggleSegmento = (recorteId: string, rotulo: string) => {
    setSegmentosSel((prev) => {
      const atual = prev[recorteId] ?? [];
      const novo = atual.includes(rotulo) ? atual.filter((x) => x !== rotulo) : [...atual, rotulo];
      return { ...prev, [recorteId]: novo };
    });
  };

  const limparFiltros = () => {
    setRecortesAtivos(null);
    setIndicadoresAtivos(['fib', 'segPsi', 'hse']);
    setSegmentosSel({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Cruzamento Sociodemográfico</h2>
          <p className="text-sm text-muted-foreground">
            Resultados consolidados das pesquisas por recortes de perfil. Heatmap 0–100 (verde = saudável, vermelho = crítico).
          </p>
          {data.source === 'seed' && (
            <Badge variant="outline" className="mt-2 text-[10px]">Dados ilustrativos · sem ciclo coletado</Badge>
          )}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros dinâmicos</CardTitle>
          <CardDescription>Selecione recortes, indicadores e segmentos. A heatmap abaixo atualiza em tempo real.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Recortes</p>
            <ToggleGroup type="multiple" value={recortesAtivosFinal} onValueChange={(v) => v.length && setRecortesAtivos(v)} className="flex-wrap justify-start">
              {RECORTES.map((r) => (
                <ToggleGroupItem key={r.id} value={r.id} size="sm">{r.titulo}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Indicadores</p>
            <ToggleGroup type="multiple" value={indicadoresAtivos} onValueChange={(v) => v.length && setIndicadoresAtivos(v)} className="flex-wrap justify-start">
              {INDICADORES.map((i) => (
                <ToggleGroupItem key={i.key} value={i.key} size="sm">{i.label}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Segmentos (clique para filtrar; vazio = todos)</p>
            {RECORTES.filter((r) => recortesAtivosFinal.includes(r.id)).map((r) => (
              <div key={r.id} className="flex flex-wrap gap-1 items-center">
                <span className="text-[11px] text-muted-foreground w-32 shrink-0">{r.titulo}:</span>
                {r.linhas.map((l) => {
                  const ativo = (segmentosSel[r.id] ?? []).includes(l.rotulo);
                  return (
                    <Badge
                      key={l.rotulo}
                      variant={ativo ? 'default' : 'outline'}
                      className="cursor-pointer text-[11px]"
                      onClick={() => toggleSegmento(r.id, l.rotulo)}
                    >
                      {l.rotulo}
                    </Badge>
                  );
                })}
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-8">
            <X className="h-3 w-3 mr-1" /> Limpar filtros
          </Button>
        </CardContent>
      </Card>

      <div ref={dashboardRef} className="grid gap-4 lg:grid-cols-2 bg-background p-1">
        {recortesFiltrados.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-base">{r.titulo}</CardTitle>
              <CardDescription>
                {INDICADORES.filter((i) => indicadoresAtivos.includes(i.key)).map((i) => i.label).join(' · ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {r.linhas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum segmento selecionado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-2">Segmento</th>
                        {INDICADORES.filter((i) => indicadoresAtivos.includes(i.key)).map((i) => (
                          <th key={i.key} className="py-2 px-2 text-center">{i.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.linhas.map((l) => (
                        <tr key={l.rotulo} className="border-t">
                          <td className="py-2 pr-2 font-medium">{l.rotulo}</td>
                          {INDICADORES.filter((i) => indicadoresAtivos.includes(i.key)).map((i) => {
                            const v = (l as any)[i.key] as number;
                            return (
                              <td key={i.key} className={`py-2 px-2 text-center tabular-nums ${corCelula(v)}`}>{v}</td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
