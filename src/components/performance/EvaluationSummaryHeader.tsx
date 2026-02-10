import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { evaluationStatusLabels, evaluationStatusColors, type EvaluationDirectoryRow } from "@/hooks/usePerformanceEvaluations";
import { Target, TrendingUp, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "./RetentionRiskSection";

interface EvaluationSummaryHeaderProps {
  evaluation: EvaluationDirectoryRow;
  finalScore: number;
  potentialScore: number;
  retentionRiskLevel: RiskLevel | null;
  impactLevel: string | null;
}

function getLevel(score: number): "low" | "medium" | "high" {
  if (score < 1.67) return "low";
  if (score < 3.33) return "medium";
  return "high";
}

const levelLabels: Record<string, Record<string, string>> = {
  performance: {
    low: "Baixo Desempenho",
    medium: "Desempenho Médio",
    high: "Alta Performance",
  },
  potential: {
    low: "Baixo Potencial",
    medium: "Potencial Médio",
    high: "Alto Potencial",
  },
};

const levelColors: Record<string, string> = {
  low: "text-red-600 dark:text-red-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-green-600 dark:text-green-400",
};

const riskBadgeConfig: Record<string, { label: string; variant: string }> = {
  low: { label: "Risco Baixo", variant: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
  medium: { label: "Risco Médio", variant: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  high: { label: "Risco Alto", variant: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

const impactBadgeConfig: Record<string, { label: string; variant: string }> = {
  low: { label: "Impacto Baixo", variant: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
  medium: { label: "Impacto Médio", variant: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  high: { label: "Impacto Alto", variant: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400" },
};

// Mini 9Box inline
const boxConfig: Record<string, { label: string; color: string }> = {
  "high-high": { label: "Estrela", color: "bg-emerald-500" },
  "high-medium": { label: "Potencial", color: "bg-emerald-400" },
  "high-low": { label: "Enigma", color: "bg-amber-400" },
  "medium-high": { label: "Alto Impacto", color: "bg-blue-500" },
  "medium-medium": { label: "Confiável", color: "bg-blue-400" },
  "medium-low": { label: "Desenvolvimento", color: "bg-amber-500" },
  "low-high": { label: "Especialista", color: "bg-slate-400" },
  "low-medium": { label: "Manutenção", color: "bg-slate-500" },
  "low-low": { label: "Ação Urgente", color: "bg-red-500" },
};

export function EvaluationSummaryHeader({
  evaluation,
  finalScore,
  potentialScore,
  retentionRiskLevel,
  impactLevel,
}: EvaluationSummaryHeaderProps) {
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const perfLevel = getLevel(finalScore);
  const potLevel = getLevel(potentialScore);
  const boxKey = `${potLevel}-${perfLevel}`;
  const box = boxConfig[boxKey];

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      {/* Row 1: Avatar + info + status */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={evaluation.employee_avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(evaluation.employee_full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{evaluation.employee_full_name ?? "Colaborador"}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {evaluation.employee_job_title ?? "Cargo não informado"}
            {evaluation.employee_grade && ` • Grade ${evaluation.employee_grade}`}
          </p>
        </div>
        <Badge className={evaluationStatusColors[evaluation.status]}>
          {evaluationStatusLabels[evaluation.status]}
        </Badge>
      </div>

      {/* Row 2: Scores + Mini 9Box + Badges */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Performance Score */}
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className={cn("text-2xl font-bold leading-none", levelColors[perfLevel])}>
              {finalScore.toFixed(1)}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {levelLabels.performance[perfLevel]}
            </span>
          </div>
        </div>

        {/* Potential Score */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className={cn("text-2xl font-bold leading-none", levelColors[potLevel])}>
              {potentialScore.toFixed(1)}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {levelLabels.potential[potLevel]}
            </span>
          </div>
        </div>

        {/* Mini 9Box */}
        <div className="flex flex-col items-center gap-0.5" title={`9Box: ${box?.label}`}>
          <div className="grid grid-cols-3 gap-px w-[36px] h-[36px]">
            {["high-low", "high-medium", "high-high",
              "medium-low", "medium-medium", "medium-high",
              "low-low", "low-medium", "low-high"].map((key) => (
              <div
                key={key}
                className={cn(
                  "rounded-[2px]",
                  key === boxKey
                    ? `${boxConfig[key].color} ring-1 ring-foreground/50`
                    : "bg-muted-foreground/15"
                )}
              />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground font-medium">{box?.label}</span>
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 ml-auto flex-wrap">
          {retentionRiskLevel && (
            <Badge className={cn("text-[10px] gap-1", riskBadgeConfig[retentionRiskLevel].variant)}>
              <ShieldAlert className="h-3 w-3" />
              {riskBadgeConfig[retentionRiskLevel].label}
            </Badge>
          )}
          {impactLevel && impactBadgeConfig[impactLevel] && (
            <Badge className={cn("text-[10px] gap-1", impactBadgeConfig[impactLevel].variant)}>
              <Zap className="h-3 w-3" />
              {impactBadgeConfig[impactLevel].label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
