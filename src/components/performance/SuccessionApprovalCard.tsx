import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Send, 
  Loader2, 
  Crown,
  Award,
  FileCheck,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SuccessionWithRelations } from "@/hooks/usePerformanceSuccession";
import { rankIcons, readinessLabels } from "@/hooks/usePerformanceSuccession";

interface SuccessionApprovalCardProps {
  positionId: string;
  positionTitle: string;
  successors: SuccessionWithRelations[];
  aiRecommendation?: string | null;
}

export function SuccessionApprovalCard({ 
  positionId, 
  positionTitle, 
  successors,
  aiRecommendation 
}: SuccessionApprovalCardProps) {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const [selectedSuccessorId, setSelectedSuccessorId] = useState<string>("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find currently approved successor
  const approvedSuccession = successors.find(s => s.selected_as_successor);

  const handleApprove = async () => {
    if (!selectedSuccessorId || !activeCompanyId) {
      toast.error("Selecione um candidato para aprovar");
      return;
    }

    const selectedSuccession = successors.find(s => s.id === selectedSuccessorId);
    if (!selectedSuccession) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // 1. Update the selected successor as approved
      const { error: updateError } = await supabase
        .from("performance_succession")
        .update({
          status: "approved",
          selected_as_successor: true,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          approval_comments: comments || null,
        })
        .eq("id", selectedSuccessorId);

      if (updateError) throw updateError;

      // 2. Unselect other successors for this position
      const otherIds = successors
        .filter(s => s.id !== selectedSuccessorId)
        .map(s => s.id);

      if (otherIds.length > 0) {
        await supabase
          .from("performance_succession")
          .update({
            status: "pending",
            selected_as_successor: false,
          })
          .in("id", otherIds);
      }

      // 3. Record the decision in succession_decisions
      const { error: decisionError } = await supabase
        .from("succession_decisions")
        .insert({
          root_company_id: activeCompanyId,
          succession_id: selectedSuccessorId,
          key_position_id: positionId,
          successor_employee_id: selectedSuccession.successor_employee_id,
          decision_type: "approved",
          decision_by: user.id,
          comments: comments || null,
          ai_recommendation: aiRecommendation || null,
        });

      if (decisionError) throw decisionError;

      // 4. Find the latest evaluation for this employee and add succession info
      const { data: latestEvaluation } = await supabase
        .from("performance_evaluations")
        .select("id, manager_comments")
        .eq("employee_id", selectedSuccession.successor_employee_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestEvaluation) {
        // Append succession decision to manager comments
        const successionNote = `\n\n🏆 DECISÃO DE SUCESSÃO (${new Date().toLocaleDateString("pt-BR")}):\nAprovado como sucessor para: ${positionTitle}\n${comments ? `Comentários: ${comments}` : ""}`;
        
        const { error: evalUpdateError } = await supabase
          .from("performance_evaluations")
          .update({
            manager_comments: (latestEvaluation.manager_comments || "") + successionNote,
          })
          .eq("id", latestEvaluation.id);

        if (evalUpdateError) {
          console.error("Error updating evaluation:", evalUpdateError);
        }

        // Link the decision to the evaluation
        await supabase
          .from("succession_decisions")
          .update({ linked_evaluation_id: latestEvaluation.id })
          .eq("succession_id", selectedSuccessorId)
          .eq("decision_type", "approved");
      }

      queryClient.invalidateQueries({ queryKey: ["performance-succession"] });
      toast.success(`${selectedSuccession.successor?.full_name} aprovado como sucessor!`);
      setComments("");
      setSelectedSuccessorId("");

    } catch (error) {
      console.error("Error approving successor:", error);
      toast.error("Erro ao aprovar sucessor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already approved, show approval status
  if (approvedSuccession) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 dark:border-green-800/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/50">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-base text-green-800 dark:text-green-200">
              Sucessor Aprovado
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/80 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/30">
            <Avatar className="h-10 w-10 ring-2 ring-green-500/30">
              <AvatarImage src={approvedSuccession.successor?.avatar_url || undefined} />
              <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                {approvedSuccession.successor?.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-foreground truncate">
                  {approvedSuccession.successor?.full_name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {approvedSuccession.successor?.job_title} • {readinessLabels[approvedSuccession.readiness]}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Award className="h-3 w-3 mr-1" />
              Confirmado
            </Badge>
          </div>

          {approvedSuccession.approval_comments && (
            <div className="p-2 bg-muted/30 rounded text-xs text-muted-foreground">
              <strong>Justificativa:</strong> {approvedSuccession.approval_comments}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileCheck className="h-3.5 w-3.5" />
            <span>Decisão registrada na avaliação de desempenho</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Crown className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">Indicar Sucessor</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Selecione o candidato escolhido para sucessão da posição
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedSuccessorId}
          onValueChange={setSelectedSuccessorId}
          className="space-y-2"
        >
          {successors.map((s) => (
            <div
              key={s.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                selectedSuccessorId === s.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
              onClick={() => setSelectedSuccessorId(s.id)}
            >
              <RadioGroupItem value={s.id} id={s.id} />
              <Label htmlFor={s.id} className="flex items-center gap-3 flex-1 cursor-pointer">
                <span className="text-lg">{rankIcons[s.rank || 1]}</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={s.successor?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {s.successor?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.successor?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.successor?.job_title} • {s.successor?.grade}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {readinessLabels[s.readiness]}
                </Badge>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="comments" className="text-sm font-medium">
            Justificativa da Decisão
          </Label>
          <Textarea
            id="comments"
            placeholder="Descreva os motivos que embasaram a escolha deste candidato..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        {aiRecommendation && (
          <div className="p-3 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg border border-violet-200/50 dark:border-violet-800/30">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                Sugestão PerformAI
              </span>
            </div>
            <p className="text-xs text-violet-600/80 dark:text-violet-300/80 line-clamp-2">
              {aiRecommendation.substring(0, 150)}...
            </p>
          </div>
        )}

        <Button
          onClick={handleApprove}
          disabled={!selectedSuccessorId || isSubmitting}
          className="w-full gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Aprovar e Registrar na Avaliação
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          A decisão será registrada no histórico de avaliação do colaborador
        </p>
      </CardContent>
    </Card>
  );
}
