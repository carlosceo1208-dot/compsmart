import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert, DollarSign, MapPin, Briefcase, Cloud, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiskLevel = "low" | "medium" | "high";

export interface RetentionRiskData {
  level: RiskLevel | null;
  factors: string[];
  notes: string;
}

const riskFactorConfig: Record<string, { label: string; icon: React.ElementType }> = {
  remuneration: { label: "Remuneração", icon: DollarSign },
  location: { label: "Localização", icon: MapPin },
  career: { label: "Carreira", icon: Briefcase },
  climate: { label: "Clima Organizacional", icon: Cloud },
  market: { label: "Mercado", icon: TrendingDown },
};

const riskLevelConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: "Baixo", color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700" },
  medium: { label: "Médio", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700" },
  high: { label: "Alto", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700" },
};

interface RetentionRiskSectionProps {
  data: RetentionRiskData;
  onChange: (data: RetentionRiskData) => void;
  isReadOnly: boolean;
}

export function RetentionRiskSection({ data, onChange, isReadOnly }: RetentionRiskSectionProps) {
  const toggleFactor = (factor: string) => {
    const factors = data.factors.includes(factor)
      ? data.factors.filter((f) => f !== factor)
      : [...data.factors, factor];
    onChange({ ...data, factors });
  };

  const setLevel = (level: RiskLevel) => {
    onChange({ ...data, level: data.level === level ? null : level });
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        Risco de Perda
      </Label>

      {/* Risk Level Selector */}
      <div className="flex gap-2">
        {(Object.entries(riskLevelConfig) as [RiskLevel, typeof riskLevelConfig.low][]).map(
          ([key, config]) => (
            <button
              key={key}
              disabled={isReadOnly}
              onClick={() => setLevel(key)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all text-center",
                data.level === key
                  ? config.bgColor
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50",
                isReadOnly && "cursor-default opacity-70"
              )}
            >
              <span className={data.level === key ? config.color : ""}>
                {config.label}
              </span>
            </button>
          )
        )}
      </div>

      {/* Risk Factors */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground font-medium">Fatores de Risco</span>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(riskFactorConfig).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = data.factors.includes(key);
            return (
              <div
                key={key}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border transition-all",
                  isActive
                    ? "bg-destructive/5 border-destructive/30"
                    : "bg-muted/20 border-border/50"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-destructive" : "text-muted-foreground")} />
                <span className="text-xs flex-1">{config.label}</span>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggleFactor(key)}
                  disabled={isReadOnly}
                  className="scale-75"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {isReadOnly ? (
        data.notes && (
          <p className="text-xs text-muted-foreground italic">
            "{data.notes}"
          </p>
        )
      ) : (
        <Textarea
          value={data.notes}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Observações sobre o risco de perda..."
          rows={2}
          className="text-xs"
        />
      )}
    </div>
  );
}
