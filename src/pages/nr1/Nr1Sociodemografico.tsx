import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, X } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Linha = { rotulo: string; fib: number; segPsi: number; hse: number };
type Recorte = { id: string; titulo: string; linhas: Linha[] };

const RECORTES: Recorte[] = [
  { id: 'genero', titulo: 'Por gênero', linhas: [
    { rotulo: 'Feminino',  fib: 68, segPsi: 62, hse: 71 },
    { rotulo: 'Masculino', fib: 72, segPsi: 65, hse: 74 },
    { rotulo: 'Não-binário', fib: 64, segPsi: 58, hse: 69 },
  ]},
  { id: 'idade', titulo: 'Por faixa etária', linhas: [
    { rotulo: '< 25 anos',  fib: 70, segPsi: 60, hse: 72 },
    { rotulo: '25–34',      fib: 71, segPsi: 64, hse: 73 },
    { rotulo: '35–44',      fib: 69, segPsi: 67, hse: 74 },
    { rotulo: '45–54',      fib: 66, segPsi: 65, hse: 70 },
    { rotulo: '55+',        fib: 64, segPsi: 63, hse: 68 },
  ]},
  { id: 'tempo', titulo: 'Por tempo de casa', linhas: [
    { rotulo: '< 1 ano', fib: 73, segPsi: 66, hse: 75 },
    { rotulo: '1–3 anos', fib: 70, segPsi: 64, hse: 72 },
    { rotulo: '3–5 anos', fib: 68, segPsi: 63, hse: 70 },
    { rotulo: '5+ anos', fib: 65, segPsi: 61, hse: 68 },
  ]},
  { id: 'area', titulo: 'Por área', linhas: [
    { rotulo: 'Operações', fib: 62, segPsi: 55, hse: 64 },
    { rotulo: 'Comercial', fib: 70, segPsi: 64, hse: 71 },
    { rotulo: 'Tecnologia', fib: 74, segPsi: 70, hse: 76 },
    { rotulo: 'Administrativo', fib: 71, segPsi: 66, hse: 72 },
  ]},
];

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
  const [recortesAtivos, setRecortesAtivos] = useState<string[]>(RECORTES.map((r) => r.id));
  const [indicadoresAtivos, setIndicadoresAtivos] = useState<string[]>(['fib', 'segPsi', 'hse']);
  const [segmentosSel, setSegmentosSel] = useState<Record<string, string[]>>({});

  const recortesFiltrados = useMemo(() => {
    return RECORTES
      .filter((r) => recortesAtivos.includes(r.id))
      .map((r) => {
        const sel = segmentosSel[r.id];
        const linhas = sel && sel.length > 0 ? r.linhas.filter((l) => sel.includes(l.rotulo)) : r.linhas;
        return { ...r, linhas };
      });
  }, [recortesAtivos, segmentosSel]);

  const exportar = () => {
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

  const toggleSegmento = (recorteId: string, rotulo: string) => {
    setSegmentosSel((prev) => {
      const atual = prev[recorteId] ?? [];
      const novo = atual.includes(rotulo) ? atual.filter((x) => x !== rotulo) : [...atual, rotulo];
      return { ...prev, [recorteId]: novo };
    });
  };

  const limparFiltros = () => {
    setRecortesAtivos(RECORTES.map((r) => r.id));
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
        </div>
        <Button variant="outline" size="sm" onClick={exportar}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros dinâmicos</CardTitle>
          <CardDescription>Selecione recortes, indicadores e segmentos. A heatmap abaixo atualiza em tempo real.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Recortes</p>
            <ToggleGroup type="multiple" value={recortesAtivos} onValueChange={(v) => v.length && setRecortesAtivos(v)} className="flex-wrap justify-start">
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
            {RECORTES.filter((r) => recortesAtivos.includes(r.id)).map((r) => (
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

      <div className="grid gap-4 lg:grid-cols-2">
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
