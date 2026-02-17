import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Zap, Clock, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ImpactCalculator = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState(500);
  const [hoursPerMonth, setHoursPerMonth] = useState(80);
  const [costPerHour, setCostPerHour] = useState(150);

  const annualCost = hoursPerMonth * costPerHour * 12;
  const workDays = Math.round((hoursPerMonth * 12) / 8);
  const savingsPercent = 85;

  return (
    <Card className="bg-card border shadow-lg">
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <h3 className="font-bold text-lg">Calcule Seu Impacto</h3>
        </div>

        {/* Input 1 - Colaboradores */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Quantos colaboradores na sua empresa?</label>
            <span className="text-sm font-bold text-primary">{employees} colaboradores</span>
          </div>
          <Slider
            value={[employees]}
            onValueChange={([v]) => setEmployees(v)}
            min={50}
            max={5000}
            step={50}
            className="w-full"
          />
        </div>

        {/* Input 2 - Horas/mês */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Horas/mês que RH gasta com planilhas?</label>
            <span className="text-sm font-bold text-primary">{hoursPerMonth} horas/mês</span>
          </div>
          <Slider
            value={[hoursPerMonth]}
            onValueChange={([v]) => setHoursPerMonth(v)}
            min={10}
            max={200}
            step={10}
            className="w-full"
          />
        </div>

        {/* Input 3 - Custo/hora */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Custo médio/hora da equipe de RH?</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">R$</span>
            <Input
              type="number"
              min={50}
              max={500}
              value={costPerHour}
              onChange={(e) => setCostPerHour(Math.min(500, Math.max(50, Number(e.target.value) || 50)))}
              className="w-28"
            />
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-destructive/5 border-l-4 border-destructive rounded-r-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-destructive font-bold text-lg">
            <TrendingDown className="h-5 w-5" />
            Sua empresa perde R$ {annualCost.toLocaleString("pt-BR")}/ano com planilhas
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Isso equivale a <strong className="text-foreground">{workDays} dias</strong> de trabalho desperdiçados
          </div>
          <div className="flex items-center gap-2 text-sm text-secondary font-medium">
            📊 Economize <strong>{savingsPercent}%</strong> automatizando com CompSmart
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="cta-action flex-1 group"
            onClick={() => navigate("/auth")}
          >
            Eliminar Esse Custo Agora 🚀
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => document.getElementById("interactive-demo")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver Como Funciona
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          ✅ 14 dias grátis • Sem cartão • Cancele quando quiser
        </p>
      </CardContent>
    </Card>
  );
};
