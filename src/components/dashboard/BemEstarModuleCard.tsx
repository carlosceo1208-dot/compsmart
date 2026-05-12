import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Brain, ArrowRight, FileText, ListChecks, Sparkles, Bot, ShieldCheck, AlertTriangle, Info,
} from "lucide-react";
import { useNr1Subscription, useNr1Diagnosticos } from "@/hooks/useNr1";
import { RISCO_LABEL, RISCO_CLASS, type NivelRisco } from "@/lib/nr1";

export function BemEstarModuleCard() {
  const { data: sub } = useNr1Subscription();
  const { data: diagnosticos } = useNr1Diagnosticos();
  const ultimo = diagnosticos?.[0];
  const risco = (ultimo?.nivel_risco ?? null) as NivelRisco | null;

  const statusBadge = !sub ? (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200">14 dias grátis</Badge>
  ) : risco ? (
    <Badge className={RISCO_CLASS[risco]}>Risco {RISCO_LABEL[risco]}</Badge>
  ) : (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200">NR-1 Ativo</Badge>
  );

  const subtitle = !sub
    ? "Gestão de Riscos Psicossociais conforme NR-1"
    : !ultimo
      ? "Inicie seu primeiro diagnóstico de saúde mental"
      : `Último diagnóstico: ${ultimo.ciclo_nome}`;

  const shortcuts = [
    { to: "/nr1/diagnostico/novo", label: "Diagnóstico", icon: FileText },
    { to: "/nr1/diagnosticos", label: "Histórico", icon: ListChecks },
    { to: "/nr1/inteligencia", label: "Inteligência", icon: Sparkles },
    { to: "/nr1/agente", label: "Agente IA", icon: Bot },
  ];

  return (
    <TooltipProvider delayDuration={150}>
    <Card className="overflow-hidden border-2 border-blue-200/60 dark:border-blue-800/30 bg-gradient-to-br from-blue-50 via-white to-sky-50 dark:from-blue-950/30 dark:via-background dark:to-sky-950/30 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg shrink-0 cursor-help">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                Módulo dedicado à <strong>Saúde Mental no Trabalho</strong> conforme a <strong>NR-1</strong> (Portaria MTE 1.419/2024): identificação, avaliação e controle de riscos psicossociais.
              </TooltipContent>
            </Tooltip>
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 flex items-center gap-2">
                Saúde Mental & NR-1
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-blue-500 cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    Cumprimento obrigatório da NR-1 — Gerenciamento de Riscos Psicossociais (GRO/PGR) com diagnóstico, planos de ação e monitoramento.
                  </TooltipContent>
                </Tooltip>
              </h3>
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Alerta se sem diagnóstico */}
        {sub && !ultimo && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Sem diagnósticos no último ciclo — risco de não conformidade.
          </div>
        )}
        {!sub && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-blue-300/60 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-900 dark:text-blue-200">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Obrigatório por lei (Portaria MTE 1.419/2024). Multa de R$ 670 a R$ 6.708 por infração.
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 mb-4">
          {shortcuts.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="flex flex-col items-center p-2 rounded-lg bg-white/60 dark:bg-background/50 hover:bg-white hover:shadow-sm transition-all"
            >
              <s.icon className="h-4 w-4 text-blue-600 mb-1" />
              <span className="text-xs text-muted-foreground text-center">{s.label}</span>
            </Link>
          ))}
        </div>

        <Link to="/nr1">
          <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
            Acessar Módulo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
