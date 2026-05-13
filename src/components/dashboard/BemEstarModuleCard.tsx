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
import { GRAU_RISCO_INSS, type GrauRiscoInss } from "@/lib/nr1Risco";

export function BemEstarModuleCard() {
  const { data: sub } = useNr1Subscription();
  const { data: diagnosticos } = useNr1Diagnosticos();
  const ultimo = diagnosticos?.[0];
  const risco = (ultimo?.nivel_risco ?? null) as NivelRisco | null;
  const grau = ((sub as any)?.grau_risco_inss ?? null) as GrauRiscoInss | null;
  const grauInfo = grau ? GRAU_RISCO_INSS[grau] : null;

  const statusBadges = (
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      {grauInfo ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${grauInfo.bg} ${grauInfo.cor} border cursor-help`}>
              Grau {grauInfo.grau} · {grauInfo.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-semibold mb-1">Grau {grauInfo.grau} — {grauInfo.label} ({grauInfo.rat})</p>
            <p className="text-xs">{grauInfo.exemplos}</p>
          </TooltipContent>
        </Tooltip>
      ) : sub ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/nr1">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 cursor-pointer hover:bg-amber-200">
                Definir Grau de Risco
              </Badge>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            Classifique o grau de risco INSS (CNAE) da empresa para visualizar exigências NR-1.
          </TooltipContent>
        </Tooltip>
      ) : null}
      {risco ? (
        <Badge className={RISCO_CLASS[risco]}>Risco {RISCO_LABEL[risco]}</Badge>
      ) : sub && !grauInfo ? (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">NR-1 Ativo</Badge>
      ) : !sub ? (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">Conformidade NR-1</Badge>
      ) : null}
    </div>
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
    <Card className="overflow-hidden border-2 border-emerald-200/60 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950/30 dark:via-background dark:to-amber-950/20 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl shadow-lg shrink-0 cursor-help">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                Módulo dedicado à <strong>Saúde Mental no Trabalho</strong> conforme a <strong>NR-1</strong> (Portaria MTE 1.419/2024): identificação, avaliação e controle de riscos psicossociais.
              </TooltipContent>
            </Tooltip>
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                Saúde Mental e Bem Estar
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-emerald-600 cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    Cumprimento obrigatório da NR-1 — Gerenciamento de Riscos Psicossociais (GRO/PGR) com diagnóstico, planos de ação e monitoramento.
                  </TooltipContent>
                </Tooltip>
              </h3>
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
          {statusBadges}
        </div>

        {/* Alerta se sem diagnóstico */}
        {sub && !ultimo && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Sem diagnósticos no último ciclo — risco de não conformidade.
          </div>
        )}
        {!sub && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-300/60 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200">
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
              <s.icon className="h-4 w-4 text-emerald-600 mb-1" />
              <span className="text-xs text-muted-foreground text-center">{s.label}</span>
            </Link>
          ))}
        </div>

        <Link to="/nr1">
          <Button variant="outline" className="w-full gap-2 !bg-yellow-400 hover:!bg-yellow-500 !text-slate-900 !border-yellow-500 font-semibold shadow-md">
            Acessar Módulo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
