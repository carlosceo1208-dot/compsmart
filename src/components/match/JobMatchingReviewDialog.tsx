import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  JobMatchingResult,
  useReviewJobMatching,
} from "@/hooks/useJobMatching";
import { CheckCircle2, Edit3, XCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  match: JobMatchingResult | null;
  rootCompanyId: string;
}

type Mode = "approve" | "correct" | "reject";

export const JobMatchingReviewDialog = ({
  open,
  onOpenChange,
  match,
  rootCompanyId,
}: Props) => {
  const [mode, setMode] = useState<Mode>("approve");
  const [finalReasoning, setFinalReasoning] = useState("");
  const [correctedScore, setCorrectedScore] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState("");
  const review = useReviewJobMatching();

  useEffect(() => {
    if (match) {
      setFinalReasoning(match.final_reasoning ?? match.reasoning ?? "");
      setCorrectedScore(Number(match.match_score));
      setReviewNotes(match.review_notes ?? "");
      setMode("approve");
    }
  }, [match]);

  if (!match) return null;

  const handleSubmit = async () => {
    const status =
      mode === "approve"
        ? "approved"
        : mode === "correct"
        ? "corrected"
        : "rejected";

    await review.mutateAsync({
      resultId: match.id,
      jobTitleId: match.job_title_id,
      status,
      finalReasoning: mode !== "reject" ? finalReasoning : undefined,
      correctedScore: mode === "correct" ? correctedScore : undefined,
      reviewNotes,
      rootCompanyId,
      matchedMarketRole: match.matched_market_role,
      matchedCboCode: match.matched_cbo_code,
      recommendations: match.recommendations,
      marketMedian: match.market_median,
      internalMedian: match.internal_median,
      gapPct: match.gap_pct,
      currentVersion: match.version,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisão Humana — {match.job_title?.title}</DialogTitle>
          <DialogDescription>
            Match IA → <strong>{match.matched_market_role}</strong> · Score
            atual: {Math.round(Number(match.match_score))}% · Versão{" "}
            {match.version}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "approve" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("approve")}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
            </Button>
            <Button
              type="button"
              variant={mode === "correct" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("correct")}
            >
              <Edit3 className="h-4 w-4 mr-1" /> Corrigir
            </Button>
            <Button
              type="button"
              variant={mode === "reject" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setMode("reject")}
            >
              <XCircle className="h-4 w-4 mr-1" /> Rejeitar
            </Button>
          </div>

          {match.ai_original_reasoning && (
            <div className="rounded-md border p-3 bg-muted/30 text-sm">
              <div className="text-xs font-semibold text-muted-foreground mb-1">
                Justificativa original da IA
              </div>
              <p className="whitespace-pre-wrap">{match.ai_original_reasoning}</p>
            </div>
          )}

          {mode !== "reject" && (
            <div className="space-y-2">
              <Label htmlFor="final-reasoning">
                Justificativa final {mode === "correct" && "(corrigida)"}
              </Label>
              <Textarea
                id="final-reasoning"
                value={finalReasoning}
                onChange={(e) => setFinalReasoning(e.target.value)}
                rows={5}
              />
            </div>
          )}

          {mode === "correct" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Score corrigido</Label>
                <Badge variant="secondary">{correctedScore}%</Badge>
              </div>
              <Slider
                value={[correctedScore]}
                onValueChange={(v) => setCorrectedScore(v[0])}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Score original IA:{" "}
                {match.ai_original_score
                  ? Math.round(Number(match.ai_original_score))
                  : "—"}
                % · Uma nova versão será criada.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="review-notes">Notas da revisão (opcional)</Label>
            <Input
              id="review-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Motivo, contexto, ajustes feitos..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={review.isPending}>
            {review.isPending ? "Salvando..." : "Confirmar revisão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
