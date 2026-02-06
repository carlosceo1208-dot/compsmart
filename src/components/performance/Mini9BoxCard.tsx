import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

interface BoxData {
  position: string;
  count: number;
  color: string;
}

const boxConfig: Record<string, { label: string; color: string; position: string }> = {
  "high-high": { label: "Estrela", color: "bg-emerald-500", position: "top-right" },
  "high-medium": { label: "Potencial", color: "bg-emerald-400", position: "top-center" },
  "high-low": { label: "Enigma", color: "bg-amber-400", position: "top-left" },
  "medium-high": { label: "Alto Impacto", color: "bg-blue-500", position: "middle-right" },
  "medium-medium": { label: "Confiável", color: "bg-blue-400", position: "middle-center" },
  "medium-low": { label: "Desenvolvimento", color: "bg-amber-500", position: "middle-left" },
  "low-high": { label: "Especialista", color: "bg-slate-400", position: "bottom-right" },
  "low-medium": { label: "Manutenção", color: "bg-slate-500", position: "bottom-center" },
  "low-low": { label: "Ação Urgente", color: "bg-red-500", position: "bottom-left" },
};

export const Mini9BoxCard = () => {
  const { activeCompanyId } = useCompanyContext();

  const { data: distribution = {} } = useQuery({
    queryKey: ['9box-distribution', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return {};

      const { data: evaluations } = await supabase
        .from('performance_evaluations')
        .select('final_score, potential_score')
        .eq('root_company_id', activeCompanyId)
        .eq('status', 'approved');

      const dist: Record<string, number> = {};
      
      evaluations?.forEach((evaluation) => {
        const performance = getLevel(evaluation.final_score || 0);
        const potential = getLevel(evaluation.potential_score || 0);
        const key = `${potential}-${performance}`;
        dist[key] = (dist[key] || 0) + 1;
      });

      return dist;
    },
    enabled: !!activeCompanyId,
  });

  const totalEmployees = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Matriz 9Box
          </span>
          <Link to="/performance/9box">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              Expandir
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {totalEmployees > 0 ? (
          <div className="space-y-3">
            {/* Mini 9Box Grid */}
            <div className="grid grid-cols-3 gap-1 aspect-square max-w-[180px] mx-auto">
              {/* High Potential Row */}
              {["high-low", "high-medium", "high-high"].map((key) => (
                <MiniBox key={key} boxKey={key} count={distribution[key] || 0} />
              ))}
              {/* Medium Potential Row */}
              {["medium-low", "medium-medium", "medium-high"].map((key) => (
                <MiniBox key={key} boxKey={key} count={distribution[key] || 0} />
              ))}
              {/* Low Potential Row */}
              {["low-low", "low-medium", "low-high"].map((key) => (
                <MiniBox key={key} boxKey={key} count={distribution[key] || 0} />
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {totalEmployees}
                </div>
                <div>Avaliados</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600">
                  {distribution["high-high"] || 0}
                </div>
                <div>Top Talents</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {distribution["low-low"] || 0}
                </div>
                <div>Ação Urgente</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <LayoutGrid className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhuma avaliação concluída</p>
            <Link to="/performance/evaluations" className="text-xs text-indigo-600 hover:underline mt-1">
              Iniciar avaliações →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MiniBox = ({ boxKey, count }: { boxKey: string; count: number }) => {
  const config = boxConfig[boxKey];
  
  return (
    <div 
      className={`${config.color} rounded-sm flex items-center justify-center text-white text-xs font-bold aspect-square transition-transform hover:scale-105 cursor-pointer`}
      title={`${config.label}: ${count} colaborador(es)`}
    >
      {count > 0 ? count : ""}
    </div>
  );
};

// Escala 0-5: Low (0-1.67), Medium (1.67-3.33), High (3.33-5.0)
function getLevel(score: number): "low" | "medium" | "high" {
  if (score < 1.67) return "low";
  if (score < 3.33) return "medium";
  return "high";
}
