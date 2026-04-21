import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJobMatchingHistory } from "@/hooks/useJobMatching";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bot, UserCheck, ArrowRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  jobTitleId: string | null;
  jobTitleName?: string;
}

export const JobMatchingHistoryDialog = ({
  open,
  onOpenChange,
  jobTitleId,
  jobTitleName,
}: Props) => {
  const { data: history, isLoading } = useJobMatchingHistory(jobTitleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Análises — {jobTitleName}</DialogTitle>
          <DialogDescription>
            Versões cronológicas das análises de IA e revisões humanas.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma versão registrada para este cargo.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((h, idx) => {
                const prev = history[idx + 1];
                const scoreDelta =
                  prev && Number(h.match_score) > 0
                    ? Number(h.match_score) - Number(prev.match_score)
                    : null;
                return (
                  <div
                    key={h.id}
                    className="border rounded-lg p-3 space-y-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{h.version}</Badge>
                        {h.source === "ai" ? (
                          <Badge variant="secondary" className="gap-1">
                            <Bot className="h-3 w-3" /> IA
                          </Badge>
                        ) : (
                          <Badge className="gap-1">
                            <UserCheck className="h-3 w-3" /> Revisão humana
                          </Badge>
                        )}
                        {Number(h.match_score) > 0 && (
                          <Badge variant="default">
                            {Math.round(Number(h.match_score))}%
                          </Badge>
                        )}
                        {scoreDelta !== null && scoreDelta !== 0 && (
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              scoreDelta > 0
                                ? "text-green-600"
                                : "text-destructive"
                            }`}
                          >
                            <ArrowRight className="h-3 w-3" />
                            {scoreDelta > 0 ? "+" : ""}
                            {scoreDelta.toFixed(0)}pp
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(h.created_at), "dd/MM/yy HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    {h.matched_market_role && (
                      <div>
                        <span className="font-medium">Match: </span>
                        {h.matched_market_role}
                        {h.matched_cbo_code && (
                          <span className="text-muted-foreground">
                            {" "}
                            (CBO {h.matched_cbo_code})
                          </span>
                        )}
                      </div>
                    )}
                    {h.reasoning && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {h.reasoning}
                      </p>
                    )}
                    {h.review_notes && (
                      <p className="text-xs italic">
                        <strong>Nota:</strong> {h.review_notes}
                      </p>
                    )}
                    {h.parameters && (
                      <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2 font-mono">
                        {Object.entries(h.parameters).map(([k, v]) => (
                          <div key={k}>
                            {k}:{" "}
                            {typeof v === "object"
                              ? JSON.stringify(v)
                              : String(v)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
