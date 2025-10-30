import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye } from "lucide-react";
import { CompetencyBadge } from "./CompetencyBadge";

interface JobTitlePreviewProps {
  jobTitle: string;
  summary?: string | null;
  grade: string;
  cbo: string;
  salaryRange?: {
    min_value: number;
    max_value: number;
  } | null;
  competencies?: Array<{
    name: string;
    type: string;
    required_level: string;
  }>;
  onGenerateAI?: () => void;
  onViewDetails?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function JobTitlePreview({
  jobTitle,
  summary,
  grade,
  cbo,
  salaryRange,
  competencies = [],
  onGenerateAI,
  onViewDetails,
}: JobTitlePreviewProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="font-semibold hover:underline cursor-pointer">
          {jobTitle}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-96" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">{jobTitle}</h4>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Grade: <strong>{grade}</strong></span>
              <span>•</span>
              <span>CBO: <strong>{cbo}</strong></span>
            </div>
          </div>

          {summary ? (
            <div>
              <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              📝 Descrição ainda não gerada
            </div>
          )}

          {salaryRange && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Faixa Salarial:</p>
              <p className="text-sm font-semibold">
                {formatCurrency(salaryRange.min_value)} - {formatCurrency(salaryRange.max_value)}
              </p>
            </div>
          )}

          {competencies.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Competências Chave:</p>
              <div className="flex flex-wrap gap-1">
                {competencies.slice(0, 4).map((comp, idx) => (
                  <CompetencyBadge
                    key={idx}
                    name={comp.name}
                    level={comp.required_level as any}
                    type={comp.type as any}
                  />
                ))}
                {competencies.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{competencies.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!summary && onGenerateAI && (
              <Button size="sm" variant="outline" onClick={onGenerateAI} className="flex-1">
                <Sparkles className="w-3 h-3 mr-1" />
                Gerar com IA
              </Button>
            )}
            {onViewDetails && (
              <Button size="sm" onClick={onViewDetails} className="flex-1">
                <Eye className="w-3 h-3 mr-1" />
                Ver Detalhes
              </Button>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}