import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

interface Props {
  onDiagnostico: () => void;
  onComoFunciona: () => void;
}

export default function Nr1Hero({ onDiagnostico, onComoFunciona }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 nr1-bg-soft opacity-60" />
      <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full blur-3xl opacity-20"
        style={{ background: 'var(--nr1-gradient)' }} />

      <div className="container mx-auto px-4 py-14 lg:py-20 relative">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center max-w-6xl mx-auto">
          {/* Copy */}
          <div className="space-y-6">
            <Badge className="nr1-bg-accent font-bold uppercase tracking-wider text-[11px]">
              <Sparkles className="h-3 w-3 mr-1.5" />
              NR-1 Inteligente · 1ª do Brasil
            </Badge>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1]">
              NR-1 fez todo mundo mapear.{' '}
              <span className="nr1-text-primary">
                Só a CompSmart te diz o que fazer com o mapa.
              </span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Cruzamos <strong className="text-foreground">risco psicossocial</strong> com{' '}
              <strong className="text-foreground">9Box</strong> e{' '}
              <strong className="text-foreground">remuneração</strong>. Transformamos obrigação
              legal em <strong className="nr1-text-primary">inteligência de talentos</strong> —
              antes que o seu top talent peça demissão.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button size="lg" className="nr1-btn-primary text-white" onClick={onDiagnostico}>
                Diagnóstico grátis em 2 min <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button size="lg" variant="outline" onClick={onComoFunciona}>
                Ver o cruzamento ao vivo
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Sem cartão de crédito · Resultado imediato · LGPD-compliant
            </p>
          </div>

          {/* Visual dashboard mockup */}
          <div className="hidden lg:block">
            <div className="bg-card border rounded-2xl shadow-2xl p-5 space-y-4 nr1-card-elevated">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">Dashboard de Inteligência NR-1</p>
                <Badge variant="outline" className="text-[10px]">Live</Badge>
              </div>

              {/* Employee card */}
              <div className="border rounded-lg p-3 space-y-2 bg-background">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    MR
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Marina R. · Tech Lead</p>
                    <p className="text-[10px] text-muted-foreground">Engenharia · 4 anos</p>
                  </div>
                  <Badge className="nr1-risk-critico text-[10px]">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Risco alto
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="rounded p-2 bg-muted/50 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase">NR-1 Score</p>
                    <p className="text-base font-bold text-[hsl(var(--nr1-danger))]">71</p>
                  </div>
                  <div className="rounded p-2 bg-muted/50 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase">9Box</p>
                    <p className="text-base font-bold nr1-text-primary">Top</p>
                  </div>
                  <div className="rounded p-2 bg-muted/50 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase">Salário</p>
                    <p className="text-base font-bold text-[hsl(var(--nr1-warning))]">-12%</p>
                  </div>
                </div>
              </div>

              {/* Alert */}
              <div className="border-l-4 border-[hsl(var(--nr1-danger))] bg-[hsl(var(--nr1-danger)/0.05)] rounded p-3">
                <p className="text-xs font-semibold text-[hsl(var(--nr1-danger))] flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Alerta de retenção
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Top talent em zona de burnout + remuneração defasada. Probabilidade de
                  desligamento: <strong className="text-foreground">73%</strong> nos próximos 90 dias.
                </p>
              </div>

              {/* Mini KPIs */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Mini icon={<AlertTriangle className="h-3 w-3" />} label="Em risco" value="34%" tone="danger" />
                <Mini icon={<TrendingUp className="h-3 w-3" />} label="Top Talent" value="12" tone="primary" />
                <Mini icon={<DollarSign className="h-3 w-3" />} label="Defasados" value="8" tone="warn" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Mini({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'primary' | 'warn' | 'danger' }) {
  const color =
    tone === 'primary' ? 'nr1-text-primary' :
    tone === 'warn' ? 'text-[hsl(var(--nr1-warning))]' :
    'text-[hsl(var(--nr1-danger))]';
  return (
    <div className="rounded-lg border p-2 text-center bg-background">
      <p className="text-[9px] text-muted-foreground uppercase flex items-center justify-center gap-1">
        {icon} {label}
      </p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}
