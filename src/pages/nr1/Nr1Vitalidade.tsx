import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, Calculator, Info, Sparkles, TrendingDown, Activity } from 'lucide-react';
import { useNr1Diagnosticos } from '@/hooks/useNr1';
import { DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';

/* ---------------------------- helpers ---------------------------- */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

type Quadrante = 'vitalidade' | 'alerta' | 'estagnacao' | 'critico';

const QUADRANTE_INFO: Record<Quadrante, { label: string; descricao: string; bg: string; cor: string }> = {
  vitalidade: {
    label: 'Vitalidade',
    descricao: 'Alta saúde + alta entrega. Modelo a replicar.',
    bg: 'bg-emerald-50 border-emerald-300',
    cor: 'text-emerald-800',
  },
  alerta: {
    label: 'Alerta',
    descricao: 'Alta entrega + alto risco. Burnout iminente.',
    bg: 'bg-amber-50 border-amber-300',
    cor: 'text-amber-800',
  },
  estagnacao: {
    label: 'Estagnação',
    descricao: 'Baixa entrega + baixo risco. Falta de desafio.',
    bg: 'bg-slate-50 border-slate-300',
    cor: 'text-slate-700',
  },
  critico: {
    label: 'Crítico',
    descricao: 'Baixa entrega + alto risco. Falência do modelo.',
    bg: 'bg-amber-50 border-amber-300',
    cor: 'text-amber-800',
  },
};

/* ---------------------------- Matriz MCPS ---------------------------- */

function MatrizMCPS() {
  const { data: diagnosticos } = useNr1Diagnosticos();
  const ultimo = diagnosticos?.[0];
  const scores = (ultimo?.scores_dimensao ?? {}) as Record<string, number>;

  const pontos = useMemo(() => {
    return Object.entries(scores).map(([dim, score]) => {
      // X = saúde (100 - risco), Y = entrega (proxy invertida do risco × variação)
      // Como proxy: score baixo de risco → alta saúde; com pequena variância para visualização
      const saude = Math.max(0, Math.min(100, 100 - score));
      // Proxy de entrega: invertido para dimensões de demandas/organização
      const entrega = Math.max(0, Math.min(100, 100 - score * 0.7 - (Math.sin(dim.length) * 10 + 10)));
      const quadrante: Quadrante =
        saude >= 50 && entrega >= 50 ? 'vitalidade' :
        saude < 50 && entrega >= 50 ? 'alerta' :
        saude >= 50 && entrega < 50 ? 'estagnacao' :
        'critico';
      return { dim: dim as Dimensao, label: DIMENSAO_LABEL[dim as Dimensao] ?? dim, x: saude, y: entrega, quadrante };
    });
  }, [scores]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 nr1-text-primary" />
              Matriz MCPS — Performance × Saúde
            </CardTitle>
            <CardDescription>
              Cruzamento de saúde psicossocial (eixo X) com proxy de entrega (eixo Y) por dimensão NR-1.
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="cursor-help"><Info className="h-3 w-3 mr-1" />Como ler</Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              Cada ponto é uma dimensão NR-1. Quanto mais à direita e acima, melhor. O quadrante <strong>Crítico</strong> (inferior esquerdo) sinaliza falência do modelo de gestão.
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        {pontos.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-muted-foreground">
              Realize um diagnóstico NR-1 para visualizar a matriz.
            </p>
            <Button asChild size="sm" className="nr1-bg-primary">
              <Link to="/nr1/diagnostico/novo">Iniciar diagnóstico <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,260px] gap-6">
            {/* Plot */}
            <div className="relative w-full aspect-square max-w-[520px] mx-auto border-2 rounded-lg overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/60">
              {/* quadrant backgrounds */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="border-r border-b border-dashed border-muted-foreground/30 flex items-start justify-start p-2 text-[10px] font-semibold text-amber-700/70">ALERTA</div>
                <div className="border-b border-dashed border-muted-foreground/30 flex items-start justify-end p-2 text-[10px] font-semibold text-emerald-700/70">VITALIDADE</div>
                <div className="border-r border-dashed border-muted-foreground/30 flex items-end justify-start p-2 text-[10px] font-semibold text-amber-700/70">CRÍTICO</div>
                <div className="flex items-end justify-end p-2 text-[10px] font-semibold text-slate-600/70">ESTAGNAÇÃO</div>
              </div>
              {/* axes labels */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 text-[10px] text-muted-foreground">Saúde Psicossocial →</div>
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground whitespace-nowrap">Entrega →</div>
              {/* points */}
              {pontos.map((p) => {
                const info = QUADRANTE_INFO[p.quadrante];
                return (
                  <Tooltip key={p.dim}>
                    <TooltipTrigger asChild>
                      <button
                        className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-md hover:scale-150 transition-transform ${
                          p.quadrante === 'vitalidade' ? 'bg-emerald-500' :
                          p.quadrante === 'alerta' ? 'bg-amber-500' :
                          p.quadrante === 'estagnacao' ? 'bg-slate-400' :
                          'bg-amber-500'
                        }`}
                        style={{ left: `${p.x}%`, bottom: `${p.y}%`, transform: 'translate(-50%, 50%)' }}
                        aria-label={p.label}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold text-xs">{p.label}</p>
                      <p className={`text-[10px] ${info.cor}`}>{info.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="space-y-2">
              {(Object.keys(QUADRANTE_INFO) as Quadrante[]).map((q) => {
                const info = QUADRANTE_INFO[q];
                const count = pontos.filter((p) => p.quadrante === q).length;
                return (
                  <div key={q} className={`p-2 rounded-md border ${info.bg}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${info.cor}`}>{info.label}</span>
                      <Badge variant="outline" className="text-[10px]">{count}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{info.descricao}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------------- Calculadora Custo do Risco ---------------------------- */

function CustoDoMedo() {
  const [headcount, setHeadcount] = useState(100);
  const [salarioMedio, setSalarioMedio] = useState(6000);
  const [turnoverPct, setTurnoverPct] = useState(15);
  const [absenteismoDias, setAbsenteismoDias] = useState(8);
  const [reducaoEstimada, setReducaoEstimada] = useState(40);

  const calc = useMemo(() => {
    // Custo de turnover: ~6 meses de salário por colaborador substituído (recrutamento + onboarding + curva)
    const colabsPerdidos = headcount * (turnoverPct / 100);
    const custoTurnover = colabsPerdidos * salarioMedio * 6;

    // Absenteísmo: dias × custo/dia (salário/22) × headcount
    const custoDia = salarioMedio / 22;
    const custoAbsenteismo = headcount * absenteismoDias * custoDia;

    // Sinistralidade (saúde mental): estimativa ~3% da folha anual em casos de risco
    const folhaAnual = headcount * salarioMedio * 13.33; // 12 + 13º + férias
    const custoSinistralidade = folhaAnual * 0.03;

    const custoTotal = custoTurnover + custoAbsenteismo + custoSinistralidade;
    const economia = custoTotal * (reducaoEstimada / 100);
    const roi = economia > 0 ? economia / Math.max(1, folhaAnual * 0.005) : 0; // assume investimento ~0,5% folha

    return { custoTurnover, custoAbsenteismo, custoSinistralidade, custoTotal, economia, roi, folhaAnual };
  }, [headcount, salarioMedio, turnoverPct, absenteismoDias, reducaoEstimada]);

  return (
    <Card className="border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-amber-700" />
          Calculadora — Custo do Risco
        </CardTitle>
        <CardDescription>
          Quanto a sua organização perde por ano com cultura de medo, burnout e adoecimento mental (riscos psicossociais NR-1).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Nº de colaboradores" value={headcount} onChange={setHeadcount} />
          <Field label="Salário médio (R$)" value={salarioMedio} onChange={setSalarioMedio} step={100} />
          <Field label="Turnover voluntário (%)" value={turnoverPct} onChange={setTurnoverPct} step={1} max={100} />
          <Field label="Absenteísmo (dias/colab/ano)" value={absenteismoDias} onChange={setAbsenteismoDias} step={1} />
          <Field label="Redução esperada com plano (%)" value={reducaoEstimada} onChange={setReducaoEstimada} step={5} max={100} />
        </div>

        <Separator />

        <div className="grid sm:grid-cols-3 gap-3">
          <CostCard label="Turnover" value={calc.custoTurnover} cor="text-amber-700" bg="bg-amber-50/60" />
          <CostCard label="Absenteísmo" value={calc.custoAbsenteismo} cor="text-amber-700" bg="bg-amber-50/60" />
          <CostCard label="Sinistralidade" value={calc.custoSinistralidade} cor="text-orange-700" bg="bg-orange-50/60" />
        </div>

        <div className="rounded-lg border-2 border-amber-300 bg-amber-50/80 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Custo anual estimado</p>
              <p className="text-3xl font-bold text-amber-900">{BRL.format(calc.custoTotal)}</p>
              <p className="text-[11px] text-amber-700/80">
                {((calc.custoTotal / Math.max(1, calc.folhaAnual)) * 100).toFixed(1)}% da folha anual
              </p>
            </div>
            <TrendingDown className="h-10 w-10 text-amber-400" />
          </div>
        </div>

        <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/80 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Economia potencial com plano de ação</p>
              <p className="text-3xl font-bold text-emerald-900">{BRL.format(calc.economia)}</p>
              <p className="text-[11px] text-emerald-700/80">
                ROI estimado de Saúde Mental: <strong>{calc.roi.toFixed(1)}:1</strong>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Considera investimento ~0,5% da folha anual em programa de saúde mental e bem-estar.
                  </TooltipContent>
                </Tooltip>
              </p>
            </div>
            <Sparkles className="h-10 w-10 text-emerald-500" />
          </div>
          <Button asChild size="sm" className="mt-3 nr1-bg-primary">
            <Link to="/nr1/planos-acao">Construir plano de ação <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          * Estimativas baseadas em referências de mercado (WorldatWork, Mercer). Turnover ≈ 6 salários por substituição;
          sinistralidade saúde mental ≈ 3% da folha. Ajuste os parâmetros à realidade da sua empresa.
        </p>
      </CardContent>
    </Card>
  );
}

function Field({
  label, value, onChange, step = 1, max,
}: { label: string; value: number; onChange: (n: number) => void; step?: number; max?: number }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        min={0}
        max={max}
        step={step}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="h-9"
      />
    </div>
  );
}

function CostCard({ label, value, cor, bg }: { label: string; value: number; cor: string; bg: string }) {
  return (
    <div className={`rounded-md border p-3 ${bg}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${cor}`}>{label}</p>
      <p className={`text-lg font-bold ${cor}`}>{BRL.format(value)}</p>
    </div>
  );
}

/* ---------------------------- Page ---------------------------- */

export default function Nr1Vitalidade() {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Vitalidade Organizacional</h2>
          <p className="text-sm text-muted-foreground">
            Cruze saúde psicossocial com performance e quantifique o custo do adoecimento mental.
          </p>
        </div>
        <MatrizMCPS />
        <CustoDoMedo />
      </div>
    </TooltipProvider>
  );
}
