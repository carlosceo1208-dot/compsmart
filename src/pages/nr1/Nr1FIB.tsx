import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FIB_DIMENSOES, INSTRUMENTOS, CATEGORIA_LABEL } from '@/lib/fib';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts';

// Dados ilustrativos (mock) — serão substituídos quando ciclos FIB forem coletados.
const ciclos = [
  { nome: 'Ciclo Atual',  cor: 'hsl(var(--nr1-primary))' },
  { nome: 'Ciclo Anterior', cor: 'hsl(var(--nr1-success))' },
];

const seedColab: Record<string, number> = {
  bem_estar_psicologico: 72, saude: 68, uso_do_tempo: 61, vitalidade_comunitaria: 70,
  cultura: 74, educacao: 66, governanca: 71, meio_ambiente: 80, padrao_de_vida: 64,
};
const seedEmpresa: Record<string, number> = {
  bem_estar_psicologico: 78, saude: 82, uso_do_tempo: 70, vitalidade_comunitaria: 75,
  cultura: 80, educacao: 77, governanca: 84, meio_ambiente: 85, padrao_de_vida: 72,
};

const radarData = FIB_DIMENSOES.map((d) => ({
  dim: d.label,
  Colaborador: seedColab[d.key],
  Empresa: seedEmpresa[d.key],
}));

export default function Nr1FIB() {
  const geralColab = Math.round(Object.values(seedColab).reduce((a, b) => a + b, 0) / 9);
  const geralEmpresa = Math.round(Object.values(seedEmpresa).reduce((a, b) => a + b, 0) / 9);
  const gap = geralEmpresa - geralColab;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Bem-Estar Integral (FIB)</h2>
        <p className="text-sm text-muted-foreground">
          Felicidade Interna Bruta — comparativo entre percepção do colaborador e condições oferecidas pela empresa nas 9 dimensões.
        </p>
      </div>

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
            {FIB_DIMENSOES.map((d) => {
              const a = seedColab[d.key]; const b = seedEmpresa[d.key];
              const diff = b - a;
              return (
                <div key={d.key} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{d.label}</span>
                    <Badge variant="outline" className="text-[10px]">{d.grupo === 'pessoa' ? 'Pessoa' : 'Organização'}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <Stat label="Colab." value={`${a}%`} />
                    <Stat label="Empresa" value={`${b}%`} />
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
