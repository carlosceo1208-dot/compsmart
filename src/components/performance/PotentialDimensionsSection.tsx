import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, Users, RefreshCw, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PotentialDimension {
  dimension: string;
  score: number;
  comment: string;
}

const dimensionConfig: Record<string, { label: string; description: string; icon: React.ElementType }> = {
  learning_agility: {
    label: "Agilidade de Aprendizado",
    description: "Capacidade de aprender com experiências e aplicar em novas situações",
    icon: Lightbulb,
  },
  mental_agility: {
    label: "Agilidade Mental",
    description: "Pensamento crítico, análise de problemas complexos e tomada de decisão",
    icon: Brain,
  },
  people_agility: {
    label: "Agilidade com Pessoas",
    description: "Habilidade de liderar, influenciar e trabalhar com diferentes perfis",
    icon: Users,
  },
  change_agility: {
    label: "Agilidade com Mudanças",
    description: "Adaptabilidade, resiliência e proatividade diante de transformações",
    icon: RefreshCw,
  },
  results_agility: {
    label: "Agilidade com Resultados",
    description: "Entrega consistente de resultados sob condições desafiadoras",
    icon: Trophy,
  },
};

const dimensionKeys = ["learning_agility", "mental_agility", "people_agility", "change_agility", "results_agility"];

interface PotentialDimensionsSectionProps {
  dimensions: PotentialDimension[];
  onChange: (dimensions: PotentialDimension[]) => void;
  isReadOnly: boolean;
  onAverageChange?: (avg: number) => void;
}

export function PotentialDimensionsSection({
  dimensions,
  onChange,
  isReadOnly,
  onAverageChange,
}: PotentialDimensionsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  // Initialize dimensions if empty
  useEffect(() => {
    if (dimensions.length === 0) {
      onChange(dimensionKeys.map((d) => ({ dimension: d, score: 0, comment: "" })));
    }
  }, []);

  const average =
    dimensions.length > 0
      ? dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
      : 0;

  useEffect(() => {
    onAverageChange?.(average);
  }, [average, onAverageChange]);

  const handleScoreChange = (dimension: string, score: number) => {
    const updated = dimensions.map((d) =>
      d.dimension === dimension ? { ...d, score } : d
    );
    onChange(updated);
  };

  const handleCommentChange = (dimension: string, comment: string) => {
    const updated = dimensions.map((d) =>
      d.dimension === dimension ? { ...d, comment } : d
    );
    onChange(updated);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600 dark:text-green-400";
    if (score >= 3) return "text-amber-600 dark:text-amber-400";
    if (score >= 1) return "text-orange-600 dark:text-orange-400";
    return "text-muted-foreground";
  };

  const hasAnyScore = dimensions.some((d) => d.score > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Brain className="h-4 w-4 text-primary" />
          Avaliação de Potencial por Dimensão
        </Label>
        <div className="flex items-center gap-2">
          {hasAnyScore && (
            <Badge variant="outline" className={cn("text-xs font-bold", getScoreColor(average))}>
              Média: {average.toFixed(1)}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 px-2 text-xs"
          >
            {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
            {expanded ? "Recolher" : "Expandir"}
          </Button>
        </div>
      </div>

      {!expanded && hasAnyScore && (
        <div className="grid grid-cols-5 gap-2">
          {dimensions.map((d) => {
            const config = dimensionConfig[d.dimension];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <div
                key={d.dimension}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30 border border-border/50"
                title={config.label}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className={cn("text-lg font-bold", getScoreColor(d.score))}>
                  {d.score.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-1">
                  {config.label.split(" ").slice(-1)[0]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {expanded && (
        <div className="space-y-4">
          {dimensions.map((d) => {
            const config = dimensionConfig[d.dimension];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <div
                key={d.dimension}
                className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{config.label}</span>
                  <span className={cn("text-sm font-bold ml-auto", getScoreColor(d.score))}>
                    {d.score.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>

                {isReadOnly ? (
                  <>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(d.score / 5) * 100}%` }}
                      />
                    </div>
                    {d.comment && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        "{d.comment}"
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Slider
                      value={[d.score]}
                      onValueChange={([v]) => handleScoreChange(d.dimension, v)}
                      min={0}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>5</span>
                    </div>
                    <Textarea
                      value={d.comment}
                      onChange={(e) => handleCommentChange(d.dimension, e.target.value)}
                      placeholder={`Comentário sobre ${config.label.toLowerCase()}...`}
                      rows={2}
                      className="text-xs"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!expanded && !hasAnyScore && !isReadOnly && (
        <p className="text-xs text-muted-foreground italic">
          Clique em "Expandir" para avaliar as 5 dimensões de potencial
        </p>
      )}
    </div>
  );
}
