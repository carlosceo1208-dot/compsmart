import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePerformanceEvaluations, evaluationStatusLabels, evaluationStatusColors, EvaluationDirectoryRow } from "@/hooks/usePerformanceEvaluations";
import { Loader2, Calendar, Target, Star, TrendingUp, MessageSquare, CheckCircle, FileDown, Award, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportEvaluationToPDF } from "@/lib/pdfExport";
import { toast } from "sonner";
import { EmployeeKudosSection } from "./EmployeeKudosSection";
import { EvaluationSummaryHeader } from "./EvaluationSummaryHeader";
import { PotentialDimensionsSection, type PotentialDimension } from "./PotentialDimensionsSection";
import { RetentionRiskSection, type RetentionRiskData, type RiskLevel } from "./RetentionRiskSection";
import { EvaluationSuccessionSection } from "./EvaluationSuccessionSection";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

interface EvaluationDialogProps {
  evaluation: EvaluationDirectoryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "edit";
}

export function EvaluationDialog({ evaluation, open, onOpenChange, mode }: EvaluationDialogProps) {
  const { updateEvaluation, submitForReview, approveEvaluation } = usePerformanceEvaluations();
  const { activeCompanyId } = useCompanyContext();
  
  const [finalScore, setFinalScore] = useState<number>(0);
  const [potentialScore, setPotentialScore] = useState<number>(0);
  const [strengths, setStrengths] = useState("");
  const [improvementAreas, setImprovementAreas] = useState("");
  const [managerComments, setManagerComments] = useState("");
  const [impactLevel, setImpactLevel] = useState<string | null>(null);

  // New: Potential dimensions
  const [potentialDimensions, setPotentialDimensions] = useState<PotentialDimension[]>([]);

  // New: Retention risk
  const [retentionRisk, setRetentionRisk] = useState<RetentionRiskData>({
    level: null,
    factors: [],
    notes: "",
  });

  useEffect(() => {
    if (evaluation) {
      setFinalScore(evaluation.final_score ?? 0);
      setPotentialScore(evaluation.potential_score ?? 0);
      setStrengths(evaluation.strengths ?? "");
      setImprovementAreas(evaluation.improvement_areas ?? "");
      setManagerComments(evaluation.manager_comments ?? "");
      
      // Load retention risk from evaluation (cast from any since view may not have these yet)
      const evalAny = evaluation as any;
      setRetentionRisk({
        level: evalAny.retention_risk_level ?? null,
        factors: evalAny.retention_risk_factors ?? [],
        notes: evalAny.retention_risk_notes ?? "",
      });
      setImpactLevel(evalAny.impact_level ?? null);

      // Load potential dimensions
      loadPotentialDimensions(evaluation.id);
    }
  }, [evaluation]);

  const loadPotentialDimensions = async (evaluationId: string) => {
    const { data } = await supabase
      .from("evaluation_potential_dimensions")
      .select("dimension, score, comment")
      .eq("evaluation_id", evaluationId)
      .order("dimension");
    
    if (data && data.length > 0) {
      setPotentialDimensions(data.map(d => ({
        dimension: d.dimension,
        score: Number(d.score),
        comment: d.comment ?? "",
      })));
    } else {
      setPotentialDimensions([]);
    }
  };

  const isReadOnly = !evaluation || mode === "view" || evaluation.status === "approved";

  const handlePotentialAverageChange = useCallback((avg: number) => {
    if (!isReadOnly && potentialDimensions.some(d => d.score > 0)) {
      setPotentialScore(Math.round(avg * 10) / 10);
    }
  }, [isReadOnly, potentialDimensions]);

  if (!evaluation) return null;

  const savePotentialDimensions = async () => {
    if (!activeCompanyId || !evaluation) return;
    
    const hasScores = potentialDimensions.some(d => d.score > 0);
    if (!hasScores) return;

    // Upsert dimensions
    for (const dim of potentialDimensions) {
      await supabase
        .from("evaluation_potential_dimensions")
        .upsert({
          evaluation_id: evaluation.id,
          dimension: dim.dimension,
          score: dim.score,
          comment: dim.comment || null,
          root_company_id: activeCompanyId,
        }, {
          onConflict: "evaluation_id,dimension",
        });
    }
  };

  const handleSave = async () => {
    // Save potential dimensions first
    await savePotentialDimensions();

    updateEvaluation.mutate({
      id: evaluation.id,
      final_score: finalScore,
      potential_score: potentialScore,
      strengths: strengths || null,
      improvement_areas: improvementAreas || null,
      manager_comments: managerComments || null,
      retention_risk_level: retentionRisk.level as any,
      retention_risk_factors: retentionRisk.factors as any,
      retention_risk_notes: retentionRisk.notes || null,
      impact_level: impactLevel as any,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleSubmit = () => {
    submitForReview.mutate(evaluation.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleApprove = () => {
    approveEvaluation.mutate(evaluation.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "view" ? "Visualizar Avaliação" : "Editar Avaliação"}
          </DialogTitle>
          <DialogDescription>
            {evaluation.cycle_name} • {evaluation.template_name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* NEW: Executive Summary Header */}
            <EvaluationSummaryHeader
              evaluation={evaluation}
              finalScore={finalScore}
              potentialScore={potentialScore}
              retentionRiskLevel={retentionRisk.level}
              impactLevel={impactLevel}
            />

            <Separator />

            {/* Scores */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Nota de Desempenho
                </Label>
                {isReadOnly ? (
                  <div className={`text-3xl font-bold ${getScoreColor(finalScore)}`}>
                    {finalScore.toFixed(1)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Slider
                      value={[finalScore]}
                      onValueChange={([v]) => setFinalScore(v)}
                      min={0}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">0</span>
                      <span className={`font-bold ${getScoreColor(finalScore)}`}>{finalScore.toFixed(1)}</span>
                      <span className="text-muted-foreground">5</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Nota de Potencial
                  {potentialDimensions.some(d => d.score > 0) && (
                    <span className="text-[10px] text-muted-foreground">(auto: média dimensões)</span>
                  )}
                </Label>
                {isReadOnly ? (
                  <div className={`text-3xl font-bold ${getScoreColor(potentialScore)}`}>
                    {potentialScore.toFixed(1)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Slider
                      value={[potentialScore]}
                      onValueChange={([v]) => setPotentialScore(v)}
                      min={0}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">0</span>
                      <span className={`font-bold ${getScoreColor(potentialScore)}`}>{potentialScore.toFixed(1)}</span>
                      <span className="text-muted-foreground">5</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* NEW: Potential Dimensions */}
            <PotentialDimensionsSection
              dimensions={potentialDimensions}
              onChange={setPotentialDimensions}
              isReadOnly={isReadOnly}
              onAverageChange={handlePotentialAverageChange}
            />

            <Separator />

            {/* NEW: Retention Risk + Impact Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RetentionRiskSection
                data={retentionRisk}
                onChange={setRetentionRisk}
                isReadOnly={isReadOnly}
              />
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4 text-primary" />
                  Nível de Impacto
                </Label>
                <p className="text-xs text-muted-foreground">
                  Impacto da saída deste colaborador na organização
                </p>
                <div className="flex gap-2">
                  {([
                    { key: "low", label: "Baixo", color: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300" },
                    { key: "medium", label: "Médio", color: "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300" },
                    { key: "high", label: "Alto", color: "bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.key}
                      disabled={isReadOnly}
                      onClick={() => setImpactLevel(impactLevel === opt.key ? null : opt.key)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all text-center ${
                        impactLevel === opt.key ? opt.color : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                      } ${isReadOnly ? "cursor-default opacity-70" : ""}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Comentários */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Pontos Fortes
                </Label>
                {isReadOnly ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {strengths || "Não informado"}
                  </p>
                ) : (
                  <Textarea
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Descreva os pontos fortes do colaborador..."
                    rows={3}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Áreas de Melhoria
                </Label>
                {isReadOnly ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {improvementAreas || "Não informado"}
                  </p>
                ) : (
                  <Textarea
                    value={improvementAreas}
                    onChange={(e) => setImprovementAreas(e.target.value)}
                    placeholder="Descreva as áreas que precisam de desenvolvimento..."
                    rows={3}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comentários do Gestor
                </Label>
                {isReadOnly ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {managerComments || "Não informado"}
                  </p>
                ) : (
                  <Textarea
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    placeholder="Comentários adicionais do gestor..."
                    rows={3}
                  />
                )}
              </div>
            </div>

            <Separator />

            {/* NEW: Succession Nomination */}
            <EvaluationSuccessionSection
              employeeId={evaluation.employee_id}
              employeeName={evaluation.employee_full_name}
              isReadOnly={isReadOnly}
            />

            <Separator />

            {/* Reconhecimentos recebidos durante o ciclo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Reconhecimentos Recebidos (Evidências Qualitativas)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Reconhecimentos enviados por colegas durante o período de avaliação
              </p>
              <EmployeeKudosSection
                employeeId={evaluation.employee_id}
                employeeName={evaluation.employee_full_name ?? undefined}
                showAsCard={false}
                maxHeight="200px"
                className="border rounded-lg p-3 bg-muted/20"
              />
            </div>

            {/* Metadados */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Criado em {format(new Date(evaluation.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              {evaluation.approved_at && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  Aprovado em {format(new Date(evaluation.approved_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              exportEvaluationToPDF(evaluation);
              toast.success("PDF exportado com sucesso!");
            }}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
          {mode === "edit" && evaluation.status === "draft" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateEvaluation.isPending}
              >
                {updateEvaluation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={submitForReview.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {submitForReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar para Revisão
              </Button>
            </>
          )}
          {mode === "edit" && evaluation.status === "pending_review" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateEvaluation.isPending}
              >
                {updateEvaluation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={approveEvaluation.isPending}
                variant="default"
              >
                {approveEvaluation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aprovar
              </Button>
            </>
          )}
          {mode === "edit" && evaluation.status === "reviewed" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateEvaluation.isPending}
              >
                {updateEvaluation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={approveEvaluation.isPending}
                variant="default"
              >
                {approveEvaluation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aprovar
              </Button>
            </>
          )}
          {(mode === "view" || evaluation.status === "approved") && (
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
