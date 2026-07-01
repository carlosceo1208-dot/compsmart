import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiBadge } from "@/components/ui/ai-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompensationTrends, CompensationTrend } from "@/hooks/useCompensationTrends";
import { formatDateTimePtBR } from "@/lib/formatDateTime";
import { TrendDetailDialog } from "./TrendDetailDialog";
import { 
  TrendingUp, 
  RefreshCw, 
  DollarSign, 
  Gift, 
  Home, 
  Cpu, 
  Users,
  AlertCircle,
  ChevronRight,
  Info
} from "lucide-react";

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  salários: { icon: DollarSign, color: "bg-emerald-500/20 text-emerald-600", label: "Salários" },
  benefícios: { icon: Gift, color: "bg-purple-500/20 text-purple-600", label: "Benefícios" },
  trabalho_remoto: { icon: Home, color: "bg-blue-500/20 text-blue-600", label: "Remoto" },
  tecnologia: { icon: Cpu, color: "bg-orange-500/20 text-orange-600", label: "Tecnologia" },
  liderança: { icon: Users, color: "bg-pink-500/20 text-pink-600", label: "Liderança" },
};

const TrendItem = ({ trend, onClick }: { trend: CompensationTrend; onClick: () => void }) => {
  const config = categoryConfig[trend.category] || categoryConfig.salários;
  const IconComponent = config.icon;

  return (
    <div 
      className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
        <IconComponent className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground line-clamp-1">{trend.title}</h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{trend.summary}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs px-2 py-0">
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">• {trend.source}</span>
        </div>
      </div>
      <div className="flex items-center">
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
    <p className="text-sm text-muted-foreground mb-3">
      Não foi possível carregar as tendências
    </p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Tentar novamente
    </Button>
  </div>
);

export const CompensationTrendsCard = () => {
  const { trends, isLoading, isError, refetch, isFetching, isFallback, fallbackReason, fetchedAt } = useCompensationTrends();
  const cachedAtLabel = fetchedAt ? formatDateTimePtBR(fetchedAt) : null;
  const [selectedTrend, setSelectedTrend] = useState<CompensationTrend | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTrendClick = (trend: CompensationTrend) => {
    setSelectedTrend(trend);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-primary">Tendências de Gestão de Remuneração 2026</span>
              <AiBadge variant="subtle" />
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={refetch}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isFallback && trends.length > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <div>
                  {fallbackReason === "rate_limit"
                    ? "Limite de requisições atingido — exibindo tendências em cache. Os dados podem estar desatualizados."
                    : "Exibindo tendências em cache. Os dados podem estar desatualizados."}
                </div>
                {cachedAtLabel && (
                  <div className="opacity-80">Dados em cache obtidos em {cachedAtLabel}.</div>
                )}
              </div>
            </div>
          )}
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : trends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma tendência disponível
            </div>
          ) : (
            <div className="space-y-2">
              {trends.slice(0, 5).map((trend, index) => (
                <TrendItem 
                  key={index} 
                  trend={trend} 
                  onClick={() => handleTrendClick(trend)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TrendDetailDialog 
        trend={selectedTrend}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};
