import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, User, Building2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ExternalFeedbackResponse } from "@/hooks/useExternalFeedbackResponses";

interface ExternalFeedbackResponseCardProps {
  response: ExternalFeedbackResponse;
}

const externalTypeLabels: Record<string, string> = {
  customer: "Cliente",
  supplier: "Fornecedor",
  partner: "Parceiro",
  other: "Outro",
};

export function ExternalFeedbackResponseCard({ response }: ExternalFeedbackResponseCardProps) {
  const renderRating = (rating: number | null) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-indigo-600" />
              {response.request?.external_name || "Avaliador Externo"}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{response.request?.external_email}</span>
              <Badge variant="secondary" className="ml-2">
                {externalTypeLabels[response.request?.external_type || "other"]}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Respondido em</p>
            <p className="text-sm font-medium">
              {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Nota Geral */}
        {response.overall_rating && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200/50">
            <span className="text-sm font-medium">Avaliação Geral</span>
            {renderRating(response.overall_rating)}
          </div>
        )}

        {/* Respostas às Perguntas */}
        {response.answers && response.answers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Respostas</h4>
            {response.answers.map((answer, index) => (
              <div
                key={answer.questionId || index}
                className="p-3 rounded-lg bg-muted/30 border"
              >
                <p className="text-sm font-medium mb-2">{answer.question}</p>
                {answer.rating !== undefined ? (
                  renderRating(answer.rating)
                ) : (
                  <p className="text-sm text-muted-foreground">{answer.text || "—"}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Pontos Fortes */}
        {response.strengths && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
              <span>💪</span> Pontos Fortes
            </h4>
            <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200/50">
              {response.strengths}
            </p>
          </div>
        )}

        {/* Áreas de Melhoria */}
        {response.improvement_areas && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <span>📈</span> Áreas de Melhoria
            </h4>
            <p className="text-sm bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/50">
              {response.improvement_areas}
            </p>
          </div>
        )}

        {/* Comentários Adicionais */}
        {response.additional_comments && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Comentários Adicionais
            </h4>
            <p className="text-sm bg-muted/50 p-3 rounded-lg border">
              {response.additional_comments}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
