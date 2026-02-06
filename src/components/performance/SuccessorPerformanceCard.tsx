import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, LayoutGrid, Star } from "lucide-react";

interface SuccessorPerformanceCardProps {
  employeeId: string;
}

interface EvaluationHistory {
  id: string;
  final_score: number | null;
  potential_score: number | null;
  status: string;
  cycle: {
    name: string;
    fiscal_year: number;
  } | null;
}

const boxConfig: Record<string, { label: string; color: string }> = {
  "high-high": { label: "Top Talent", color: "bg-emerald-500 text-white" },
  "high-medium": { label: "Forte Desempenho", color: "bg-emerald-400 text-white" },
  "high-low": { label: "Enigma", color: "bg-amber-400 text-white" },
  "medium-high": { label: "Alto Impacto", color: "bg-blue-500 text-white" },
  "medium-medium": { label: "Mantenedor", color: "bg-blue-400 text-white" },
  "medium-low": { label: "Desenvolvimento", color: "bg-amber-500 text-white" },
  "low-high": { label: "Especialista", color: "bg-slate-400 text-white" },
  "low-medium": { label: "Eficaz", color: "bg-slate-500 text-white" },
  "low-low": { label: "Ação Urgente", color: "bg-red-500 text-white" },
};

// Escala 0-5: Low (0-1.67), Medium (1.67-3.33), High (3.33-5.0)
function getLevel(score: number): "low" | "medium" | "high" {
  if (score < 1.67) return "low";
  if (score < 3.33) return "medium";
  return "high";
}

function get9BoxClassification(performanceScore: number, potentialScore: number) {
  const perfLevel = getLevel(performanceScore);
  const potLevel = getLevel(potentialScore);
  const key = `${potLevel}-${perfLevel}`;
  return boxConfig[key] || { label: "Sem classificação", color: "bg-gray-400 text-white" };
}

function getTrendIcon(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (diff > 0.3) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (diff < -0.3) return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export function SuccessorPerformanceCard({ employeeId }: SuccessorPerformanceCardProps) {
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ["successor-evaluations", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_evaluations")
        .select(`
          id,
          final_score,
          potential_score,
          status,
          cycle:performance_cycles(name, fiscal_year)
        `)
        .eq("employee_id", employeeId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as EvaluationHistory[];
    },
    enabled: !!employeeId,
  });

  if (isLoading) {
    return (
      <Card className="p-3 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-24" />
      </Card>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <Card className="p-3 bg-muted/30 border-dashed">
        <p className="text-sm text-muted-foreground text-center">
          Sem avaliações aprovadas
        </p>
      </Card>
    );
  }

  const latestEval = evaluations[0];
  const latestClassification = latestEval.final_score !== null && latestEval.potential_score !== null
    ? get9BoxClassification(latestEval.final_score, latestEval.potential_score)
    : null;

  return (
    <Card className="p-3 space-y-3 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20">
      {/* 9Box Classification */}
      {latestClassification && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium">Classificação 9Box</span>
          </div>
          <Badge className={`${latestClassification.color} text-xs`}>
            {latestClassification.label}
          </Badge>
        </div>
      )}

      {/* Evaluation History */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Histórico de Avaliações</span>
        </div>
        
        <div className="grid gap-2">
          {evaluations.map((evaluation, index) => {
            const prevEval = evaluations[index + 1];
            const trend = getTrendIcon(evaluation.final_score, prevEval?.final_score ?? null);
            
            return (
              <div 
                key={evaluation.id}
                className="flex items-center justify-between p-2 rounded-md bg-background/80"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground min-w-[80px]">
                    {evaluation.cycle?.name || `Ciclo ${evaluation.cycle?.fiscal_year}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Desemp:</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {evaluation.final_score?.toFixed(1) || "-"}
                    </span>
                  </div>
                  <span className="text-muted-foreground">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Pot:</span>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {evaluation.potential_score?.toFixed(1) || "-"}
                    </span>
                  </div>
                  {trend && <span className="ml-1">{trend}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Legend */}
      <div className="pt-1 border-t border-dashed">
        <p className="text-[10px] text-muted-foreground text-center">
          Escala: 0-5 | Baixo (&lt;1.67) • Médio (1.67-3.33) • Alto (&gt;3.33)
        </p>
      </div>
    </Card>
  );
}
