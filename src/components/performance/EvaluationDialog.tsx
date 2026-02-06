import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePerformanceEvaluations, evaluationStatusLabels, evaluationStatusColors, EvaluationDirectoryRow } from "@/hooks/usePerformanceEvaluations";
import { Loader2, User, Calendar, Target, Star, TrendingUp, MessageSquare, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EvaluationDialogProps {
  evaluation: EvaluationDirectoryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "edit";
}

export function EvaluationDialog({ evaluation, open, onOpenChange, mode }: EvaluationDialogProps) {
  const { updateEvaluation, submitForReview, approveEvaluation } = usePerformanceEvaluations();
  
  const [finalScore, setFinalScore] = useState<number>(0);
  const [potentialScore, setPotentialScore] = useState<number>(0);
  const [strengths, setStrengths] = useState("");
  const [improvementAreas, setImprovementAreas] = useState("");
  const [managerComments, setManagerComments] = useState("");

  useEffect(() => {
    if (evaluation) {
      setFinalScore(evaluation.final_score ?? 0);
      setPotentialScore(evaluation.potential_score ?? 0);
      setStrengths(evaluation.strengths ?? "");
      setImprovementAreas(evaluation.improvement_areas ?? "");
      setManagerComments(evaluation.manager_comments ?? "");
    }
  }, [evaluation]);

  if (!evaluation) return null;

  const isReadOnly = mode === "view" || evaluation.status === "approved";

  const handleSave = () => {
    updateEvaluation.mutate({
      id: evaluation.id,
      final_score: finalScore,
      potential_score: potentialScore,
      strengths: strengths || null,
      improvement_areas: improvementAreas || null,
      manager_comments: managerComments || null,
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

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
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
            {/* Cabeçalho do Colaborador */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-14 w-14">
                <AvatarImage src={evaluation.employee_avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(evaluation.employee_full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{evaluation.employee_full_name ?? "Colaborador"}</h3>
                <p className="text-sm text-muted-foreground">
                  {evaluation.employee_job_title ?? "Cargo não informado"}
                  {evaluation.employee_grade && ` • Grade ${evaluation.employee_grade}`}
                </p>
              </div>
              <Badge className={evaluationStatusColors[evaluation.status]}>
                {evaluationStatusLabels[evaluation.status]}
              </Badge>
            </div>

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

            {/* Metadados */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Criado em {format(new Date(evaluation.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              {evaluation.approved_at && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Aprovado em {format(new Date(evaluation.approved_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
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
                className="bg-indigo-600 hover:bg-indigo-700"
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
                className="bg-green-600 hover:bg-green-700"
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
                className="bg-green-600 hover:bg-green-700"
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
