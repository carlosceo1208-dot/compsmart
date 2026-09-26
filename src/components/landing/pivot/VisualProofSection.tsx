import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowDown, ArrowUp, Briefcase } from "lucide-react";
import { CLIMA_DATA, NR1_DATA, REMU_DATA, RS_DATA, type StatusMercado } from "@/config/visualProofData";

const Frame = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col rounded-[18px] border border-border bg-card p-4 shadow-sm">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <Badge variant="outline" className="rounded-full border-warning/40 bg-warning/10 text-[10px] text-foreground">
        Exemplo ilustrativo
      </Badge>
    </div>
    <div className="w-full sm:aspect-video">{children}</div>
  </div>
);

const Kpi = ({ label, value, tone = "text-foreground" }: { label: string; value: ReactNode; tone?: string }) => (
  <div className="rounded-xl bg-muted/50 px-2.5 py-1.5">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className={`text-sm font-bold ${tone}`}>{value}</p>
  </div>
);

const line = (vals: number[], w: number, h: number, min: number, max: number) =>
  vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(" ");

const RISK = ["bg-success/70", "bg-primary/60", "bg-warning/80", "bg-destructive/80"];

const Nr1Card = () => (
  <Frame title="NR-1 — Mapa de risco psicossocial">
    <div className="grid h-full grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
      <div className="flex flex-col">
        <div className="grid grid-cols-[64px_repeat(6,1fr)] gap-0.5 text-[8px] text-muted-foreground">
          <span />
          {NR1_DATA.dimensoes.map((d) => <span key={d} className="truncate text-center">{d}</span>)}
          {NR1_DATA.grupos.map((g, gi) => (
            <div key={g} className="contents">
              <span className="truncate pr-1 text-[9px]">{g}</span>
              {NR1_DATA.matriz[gi].map((v, di) => <div key={di} className={`h-5 rounded ${RISK[v]}`} />)}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Evolução do risco ao longo dos meses</p>
        <svg viewBox="0 0 200 40" className="mt-1 h-10 w-full" preserveAspectRatio="none">
          <polyline points={line(NR1_DATA.tendencia, 200, 36, 20, 90)} fill="none" className="stroke-success" strokeWidth="2.5" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <Badge className="w-fit rounded-full bg-success/15 text-[10px] text-success hover:bg-success/15">
          <ArrowDown className="mr-1 h-3 w-3" />{NR1_DATA.evolucao}
        </Badge>
        <Kpi label="Risco global" value={NR1_DATA.riscoGlobal} tone="text-success" />
        <Kpi label="Dimensão crítica" value={NR1_DATA.dimensoesCriticas} tone="text-destructive" />
      </div>
    </div>
  </Frame>
);

const ClimaCard = () => {
  const angle = Math.PI * (1 - (CLIMA_DATA.enps + 100) / 200);
  const x = 60 + 45 * Math.cos(angle), y = 55 - 45 * Math.sin(angle);
  return (
    <Frame title="Clima — eNPS e engajamento">
      <div className="grid h-full grid-cols-1 sm:grid-cols-[150px_1fr] gap-3">
        <div className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 120 64" className="w-full">
            <path d="M15 55 A45 45 0 0 1 105 55" fill="none" className="stroke-muted" strokeWidth="10" strokeLinecap="round" />
            <path d={`M15 55 A45 45 0 0 1 ${x} ${y}`} fill="none" className="stroke-primary" strokeWidth="10" strokeLinecap="round" />
            <text x="60" y="50" textAnchor="middle" className="fill-foreground text-[18px] font-bold">{CLIMA_DATA.enps}</text>
          </svg>
          <Badge className="rounded-full bg-success/15 text-[10px] text-success hover:bg-success/15">
            <ArrowUp className="mr-1 h-3 w-3" />{CLIMA_DATA.variacao}
          </Badge>
          <div className="grid w-full grid-cols-2 gap-1.5">
            <Kpi label="Participação" value={CLIMA_DATA.participacao} />
            <Kpi label="Engajamento" value={CLIMA_DATA.engajamento} />
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div className="space-y-1.5">
            {CLIMA_DATA.areas.map((a) => (
              <div key={a.nome} className="flex items-center gap-2 text-[10px]">
                <span className="w-16 truncate text-muted-foreground">{a.nome}</span>
                <div className="h-2.5 flex-1 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${a.valor}%` }} />
                </div>
                <span className="w-5 font-semibold">{a.valor}</span>
              </div>
            ))}
          </div>
          <div>
            <svg viewBox="0 0 200 36" className="h-9 w-full" preserveAspectRatio="none">
              <polyline points={line(CLIMA_DATA.trimestres.map((t) => t.v), 200, 32, 35, 70)} fill="none" className="stroke-primary" strokeWidth="2.5" />
            </svg>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              {CLIMA_DATA.trimestres.map((t) => <span key={t.t}>{t.t}</span>)}
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
};

const RsCard = () => {
  const max = RS_DATA.funil[0].qtd;
  return (
    <Frame title="Seleção & R&S — Funil de contratação">
      <div className="grid h-full grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
        <div className="flex flex-col justify-center gap-1">
          {RS_DATA.funil.map((f, i) => (
            <div key={f.etapa} className="flex items-center gap-2 text-[10px]">
              <span className="w-24 truncate text-muted-foreground">{f.etapa}</span>
              <div className="flex-1">
                <div className="mx-auto flex h-5 items-center justify-center rounded-md bg-primary text-[9px] font-semibold text-primary-foreground"
                  style={{ width: `${Math.max(22, (f.qtd / max) * 100)}%`, opacity: 1 - i * 0.12 }}>
                  {f.qtd}
                </div>
              </div>
              <span className="w-8 text-right">{i === 0 ? "100%" : `${Math.round((f.qtd / RS_DATA.funil[i - 1].qtd) * 100)}%`}</span>
            </div>
          ))}
          <div className="mt-1 flex flex-wrap gap-1">
            {RS_DATA.vagas.map((v) => (
              <span key={v} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px]">
                <Briefcase className="h-2.5 w-2.5" />{v}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Kpi label="Tempo médio de fecho" value={<>{RS_DATA.tempoMedio} <span className="rounded-full bg-success/15 px-1.5 text-[9px] text-success">{RS_DATA.variacaoTempo}</span></>} />
          <Kpi label="Vagas ativas" value={RS_DATA.vagasAtivas} />
          <Kpi label="Taxa de conversão" value={RS_DATA.conversao} />
          <svg viewBox="0 0 120 28" className="h-7 w-full" preserveAspectRatio="none">
            <polyline points={line(RS_DATA.tempoHistorico, 120, 24, 18, 38)} fill="none" className="stroke-success" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </Frame>
  );
};

const STATUS: Record<StatusMercado, string> = {
  Acima: "bg-primary/15 text-primary",
  Alinhado: "bg-success/15 text-success",
  Abaixo: "bg-warning/20 text-foreground",
};

const RemuCard = () => {
  const W = 200, H = 110, min = 2, max = 24;
  const pt = (v: number, i: number) => ({ x: (i / 5) * W, y: H - ((v - min) / (max - min)) * H });
  return (
    <Frame title="Remuneração — Compa-Ratio e competitividade">
      <div className="grid h-full grid-cols-1 sm:grid-cols-[1fr_130px] gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <Kpi label="Compa-Ratio" value={REMU_DATA.compaRatio} />
            <Kpi label="Abaixo do mercado" value={REMU_DATA.abaixoMercado} tone="text-warning" />
            <div className="flex items-center gap-1 rounded-xl bg-destructive/10 px-2 text-[10px] font-semibold text-destructive">
              <AlertTriangle className="h-3 w-3" />Revisar faixa
            </div>
          </div>
          <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} className="h-32 w-full flex-1 sm:h-auto" preserveAspectRatio="none">
            {([["p25", "stroke-muted-foreground/40"], ["p50", "stroke-primary"], ["p75", "stroke-muted-foreground/40"]] as const).map(([k, c]) => (
              <polyline key={k} points={line(REMU_DATA[k], W, H, min, max)} fill="none" className={c} strokeWidth={k === "p50" ? 2.5 : 1.5} strokeDasharray={k === "p50" ? undefined : "4 3"} />
            ))}
            {REMU_DATA.empresa.map((v, i) => {
              const p = pt(v, i);
              const low = v < REMU_DATA.p50[i] * 0.93;
              return <circle key={i} cx={p.x} cy={p.y} r="4" className={low ? "fill-warning" : "fill-foreground"} />;
            })}
          </svg>
          <div className="flex flex-wrap gap-x-3 text-[9px] text-muted-foreground">
            <span>- - P25 / P75</span><span className="text-primary">— P50 mercado</span><span>● Empresa</span><span className="text-warning">● Defasagem</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground">Ranking de cargos</p>
          {REMU_DATA.cargos.map((c) => (
            <div key={c.nome} className="flex items-center justify-between gap-1 text-[10px]">
              <span className="truncate">{c.nome}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${STATUS[c.status]}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
};

export const VisualProofSection = () => (
  <section className="bg-muted/30 py-16 md:py-20">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-bold md:text-4xl">Resultado não se explica — se mostra.</h2>
        <p className="mt-3 text-muted-foreground">
          Veja como a CompSmart traduz dados em decisão, módulo a módulo.
        </p>
      </div>
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
        <Nr1Card />
        <ClimaCard />
        <RsCard />
        <RemuCard />
      </div>
    </div>
  </section>
);
