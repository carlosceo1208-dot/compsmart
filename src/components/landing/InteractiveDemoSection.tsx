import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Star, CheckCircle2, AlertTriangle, ArrowRight, PartyPopper, User } from "lucide-react";

const COMPETENCIES = [
  { name: "Entrega de resultados", default: 5 },
  { name: "Trabalho em equipe", default: 4 },
  { name: "Inovação", default: 5 },
  { name: "Liderança", default: 4 },
];

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} onClick={() => onChange(s)} className="focus:outline-none" aria-label={`${s} estrelas`}>
        <Star
          className={`h-5 w-5 transition-colors ${s <= value ? "text-warning fill-warning" : "text-muted-foreground/30"}`}
        />
      </button>
    ))}
  </div>
);

export const InteractiveDemoSection = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState(COMPETENCIES.map((c) => c.default));
  const [newSalary, setNewSalary] = useState(6200);
  const [approved, setApproved] = useState(false);

  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const currentSalary = 5200;
  const minRange = 5500;
  const maxRange = 7500;
  const increase = newSalary - currentSalary;
  const increasePercent = ((increase / currentSalary) * 100).toFixed(1);
  const monthlyImpact = increase * 1.7; // encargos
  const annualImpact = monthlyImpact * 12;

  const setRating = useCallback((idx: number, val: number) => {
    setRatings((prev) => prev.map((r, i) => (i === idx ? val : r)));
  }, []);

  const progressPercent = ((step + 1) / 4) * 100;

  const steps = [
    // Step 1 - Avaliar
    <div key="step1" className="space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Ana Silva</p>
          <p className="text-xs text-muted-foreground">Analista de Marketing</p>
        </div>
      </div>
      <div className="space-y-4">
        {COMPETENCIES.map((comp, i) => (
          <div key={comp.name} className="flex items-center justify-between gap-4">
            <span className="text-sm flex-1">{comp.name}</span>
            <StarRating value={ratings[i]} onChange={(v) => setRating(i, v)} />
          </div>
        ))}
      </div>
      <div className="bg-primary/5 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">Nota Final</p>
        <p className="text-2xl font-bold text-primary">{avgRating.toFixed(1)}/5</p>
        <Badge className="mt-1 bg-secondary/10 text-secondary border-secondary/20">
          {avgRating >= 4.5 ? "Acima da Expectativa 🎯" : avgRating >= 3.5 ? "Dentro da Expectativa" : "Abaixo da Expectativa"}
        </Badge>
      </div>
      <Button className="w-full cta-action" onClick={() => setStep(1)}>
        Próximo: Ver Recomendação Salarial ➡️
      </Button>
    </div>,

    // Step 2 - Recomendação
    <div key="step2" className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Ana Silva</p>
          <p className="text-xs text-muted-foreground">Desempenho: {avgRating.toFixed(1)}/5</p>
        </div>
        <Badge className="bg-secondary/10 text-secondary border-secondary/20 ml-auto">Alto</Badge>
      </div>

      <div className="bg-primary/5 rounded-lg p-4 space-y-3">
        <p className="text-sm">Com base na avaliação <strong>{avgRating.toFixed(1)}/5</strong>, a faixa salarial ideal é:</p>
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div className="absolute h-full bg-secondary/30 rounded-full" style={{ left: `${((minRange - 4500) / 3500) * 100}%`, width: `${((maxRange - minRange) / 3500) * 100}%` }} />
          <div className="absolute w-3 h-3 bg-destructive rounded-full top-0.5" style={{ left: `${((currentSalary - 4500) / 3500) * 100}%` }} title="Atual" />
          <div className="absolute w-3 h-3 bg-secondary rounded-full top-0.5" style={{ left: `${((6200 - 4500) / 3500) * 100}%` }} title="Recomendado" />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>R$ {minRange.toLocaleString("pt-BR")}</span>
          <span>R$ {maxRange.toLocaleString("pt-BR")}</span>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Atual: R$ {currentSalary.toLocaleString("pt-BR")}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary inline-block" /> Recomendado: R$ 6.200</span>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-warning/10 border border-warning/20 rounded-lg p-3">
        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm"><strong>Distorção identificada:</strong> Ana está R$ 300 abaixo da faixa mínima para seu desempenho</p>
      </div>

      <Button className="w-full cta-action" onClick={() => setStep(2)}>
        Próximo: Simular Aumento ➡️
      </Button>
    </div>,

    // Step 3 - Simular
    <div key="step3" className="space-y-5">
      <div className="space-y-3">
        <label className="text-sm font-medium">Ajuste o novo salário de Ana Silva</label>
        <Slider
          value={[newSalary]}
          onValueChange={([v]) => setNewSalary(v)}
          min={currentSalary}
          max={maxRange}
          step={100}
        />
        <p className="text-center text-2xl font-bold text-primary">R$ {newSalary.toLocaleString("pt-BR")}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">💰 Aumento</p>
            <p className="font-bold text-secondary">R$ {increase.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-secondary">+{increasePercent}%</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">📊 Impacto Mensal</p>
            <p className="font-bold text-primary">R$ {Math.round(monthlyImpact).toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">c/ encargos</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">📅 Impacto Anual</p>
            <p className="font-bold text-warning">R$ {Math.round(annualImpact).toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">projeção 12m</p>
          </CardContent>
        </Card>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-6 justify-center h-24">
        <div className="text-center">
          <div className="w-16 bg-muted rounded-t" style={{ height: `${(currentSalary / maxRange) * 80}px` }} />
          <p className="text-[10px] mt-1 text-muted-foreground">Atual</p>
        </div>
        <div className="text-center">
          <div className="w-16 bg-secondary rounded-t" style={{ height: `${(newSalary / maxRange) * 80}px` }} />
          <p className="text-[10px] mt-1 text-secondary">Novo</p>
        </div>
      </div>

      <Button className="w-full cta-action" onClick={() => setStep(3)}>
        Próximo: Aprovar Decisão ➡️
      </Button>
    </div>,

    // Step 4 - Aprovar
    <div key="step4" className="space-y-5">
      {!approved ? (
        <>
          <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 space-y-2">
            {[
              `Colaborador: Ana Silva`,
              `Avaliação: ${avgRating.toFixed(1)}/5 (Alto Desempenho)`,
              `Novo salário: R$ ${newSalary.toLocaleString("pt-BR")}`,
              `Aumento: R$ ${increase.toLocaleString("pt-BR")} (+${increasePercent}%)`,
              `Justificativa: Alinhamento com faixa salarial e mérito`,
              `Impacto orçamentário: R$ ${Math.round(annualImpact).toLocaleString("pt-BR")}/ano`,
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
          <Button
            className="w-full bg-secondary hover:bg-secondary-hover text-secondary-foreground font-bold text-lg py-6 animate-pulse-slow"
            onClick={() => setApproved(true)}
          >
            ✓ Aprovar Decisão
          </Button>
        </>
      ) : (
        <div className="text-center space-y-4 py-4">
          <PartyPopper className="h-16 w-16 text-warning mx-auto animate-bounce-slow" />
          <h3 className="text-xl font-bold">🎉 Decisão aprovada!</h3>
          <p className="text-muted-foreground">
            Tempo total: <strong>2 minutos</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Decisão justa, auditável e baseada em dados.
          </p>
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6 space-y-3">
              <p className="font-semibold">Gostou? Faça isso de verdade na sua empresa</p>
              <Button
                variant="secondary"
                className="w-full bg-card text-primary hover:bg-card/90 font-bold group"
                onClick={() => navigate("/auth")}
              >
                Começar Teste Grátis Agora (14 dias)
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>,
  ];

  return (
    <section id="interactive-demo" className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <Badge className="bg-secondary/10 text-secondary border-secondary/20 mb-4">
            EXPERIMENTE AGORA (SEM CADASTRO)
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Veja a CompSmart em ação — <strong className="text-primary">você controla</strong>
          </h2>
          <p className="text-muted-foreground">
            Simule uma avaliação de desempenho conectada à remuneração em 4 cliques
          </p>
        </div>

        <Card className="shadow-xl border-primary/10">
          <CardContent className="p-6 md:p-8">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              {[0, 1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      s < step ? "bg-secondary text-secondary-foreground" : s === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s < step ? "✓" : s + 1}
                  </div>
                  {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? "bg-secondary" : "bg-muted"}`} />}
                </div>
              ))}
            </div>

            {steps[step]}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
