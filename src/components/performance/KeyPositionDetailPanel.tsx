import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, 
  Hash, 
  FileText, 
  Sparkles, 
  Loader2, 
  Trophy,
  AlertCircle 
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { SuccessionWithRelations } from "@/hooks/usePerformanceSuccession";

interface KeyPositionDetailPanelProps {
  positionId: string;
  successors: SuccessionWithRelations[];
}

interface PositionDetails {
  id: string;
  title: string;
  code: string;
  grade: string;
  median_points: number | null;
  hay_total_points: number | null;
  summary: string | null;
  main_responsibilities: string | null;
  hard_skills: string | null;
  soft_skills: string | null;
}

export function KeyPositionDetailPanel({ positionId, successors }: KeyPositionDetailPanelProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch position details
  const { data: position, isLoading: positionLoading } = useQuery({
    queryKey: ["key-position-details", positionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_titles")
        .select(`
          id, title, code, grade, median_points, hay_total_points,
          summary, main_responsibilities, hard_skills, soft_skills
        `)
        .eq("id", positionId)
        .single();

      if (error) throw error;
      return data as PositionDetails;
    },
    enabled: !!positionId,
  });

  // Fetch evaluations for all successors
  const successorIds = successors.map(s => s.successor_employee_id);
  
  const { data: successorEvaluations } = useQuery({
    queryKey: ["successor-evaluations-all", successorIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_evaluations")
        .select(`
          id,
          employee_id,
          final_score,
          potential_score,
          status,
          strengths,
          improvement_areas,
          cycle:performance_cycles(name, fiscal_year)
        `)
        .in("employee_id", successorIds)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Group by employee and get last 3
      const grouped = new Map<string, typeof data>();
      data?.forEach(ev => {
        const existing = grouped.get(ev.employee_id) || [];
        if (existing.length < 3) {
          existing.push(ev);
          grouped.set(ev.employee_id, existing);
        }
      });
      
      return grouped;
    },
    enabled: successorIds.length > 0,
  });

  // Generate AI Analysis
  useEffect(() => {
    if (!position || successors.length === 0 || !successorEvaluations) return;

    const generateAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Não autenticado");
        }

        // Prepare successor data for AI
        const successorData = successors.map(s => {
          const evals = successorEvaluations.get(s.successor_employee_id) || [];
          const latestEval = evals[0];
          return {
            name: s.successor?.full_name || "N/A",
            currentRole: s.successor?.job_title || "N/A",
            currentGrade: s.successor?.grade || "N/A",
            rank: s.rank,
            readiness: s.readiness,
            latestScore: latestEval?.final_score ?? null,
            latestPotential: latestEval?.potential_score ?? null,
            strengths: latestEval?.strengths || null,
            improvementAreas: latestEval?.improvement_areas || null,
            evaluationCount: evals.length,
          };
        });

        const response = await supabase.functions.invoke("succession-ai-analysis", {
          body: {
            positionTitle: position.title,
            positionGrade: position.grade,
            positionSummary: position.summary,
            positionSkills: position.hard_skills,
            successors: successorData,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "Erro na análise");
        }

        setAiAnalysis(response.data?.analysis || null);
      } catch (error) {
        console.error("AI Analysis error:", error);
        // Silently fail - don't block the UI
      } finally {
        setIsAnalyzing(false);
      }
    };

    generateAnalysis();
  }, [position, successors, successorEvaluations]);

  if (positionLoading) {
    return (
      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!position) {
    return (
      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Selecione uma posição para ver detalhes</p>
        </CardContent>
      </Card>
    );
  }

  const points = position.hay_total_points || position.median_points;

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 h-fit sticky top-4">
      <CardHeader className="pb-3 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20 rounded-t-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
            <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {position.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                {position.code}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Grade {position.grade}
              </Badge>
              {points && (
                <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  <Trophy className="h-3 w-3 mr-1" />
                  {points} pts
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Position Summary */}
        {position.summary && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Sumário do Cargo</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {position.summary}
            </p>
          </div>
        )}

        {/* Main Responsibilities - show first 2-3 lines */}
        {position.main_responsibilities && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Principais Responsabilidades
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
              {position.main_responsibilities}
            </p>
          </div>
        )}

        {/* Skills */}
        {(position.hard_skills || position.soft_skills) && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Competências Requeridas
            </div>
            <div className="flex flex-wrap gap-1">
              {position.hard_skills?.split(",").slice(0, 4).map((skill, i) => (
                <Badge 
                  key={`hard-${i}`} 
                  variant="outline" 
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                >
                  {skill.trim()}
                </Badge>
              ))}
              {position.soft_skills?.split(",").slice(0, 2).map((skill, i) => (
                <Badge 
                  key={`soft-${i}`} 
                  variant="outline" 
                  className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800"
                >
                  {skill.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* AI Analysis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Análise PerformAI
            </span>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              <span className="text-sm text-muted-foreground">
                Analisando candidatos à sucessão...
              </span>
            </div>
          ) : aiAnalysis ? (
            <div className="p-4 bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 rounded-lg border border-violet-200/50 dark:border-violet-800/30">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div 
                  className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: aiAnalysis
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />') 
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                A análise será gerada quando houver candidatos mapeados
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
