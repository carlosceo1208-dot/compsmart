import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketInsights } from "@/hooks/useMarketInsights";
import { formatDateTimePtBR } from "@/lib/formatDateTime";
import { Newspaper, RefreshCw, ExternalLink, AlertCircle, Inbox } from "lucide-react";

const formatSourceDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const MarketInsightsCard = () => {
  const { items, data, isLoading, error, refreshError, isRefreshing, refresh } = useMarketInsights();
  const rateLimited = data?.rate_limited === true;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Newspaper className="h-4 w-4 text-primary" />
            Tendências e Notícias do Mercado de RH
          </CardTitle>
          {data?.fetched_at && (
            <p className="text-xs text-muted-foreground">
              Atualizado em {formatDateTimePtBR(data.fetched_at)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing || isLoading || rateLimited}
          title={rateLimited ? "Limite de atualizações por hora atingido" : "Buscar conteúdo mais recente"}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="ml-2 hidden sm:inline">Atualizar</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-start gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            <Inbox className="h-5 w-5" />
            Nenhuma novidade encontrada no momento.
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-3">
            {(refreshError || rateLimited) && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                {refreshError ?? "Limite de atualizações por hora atingido. Exibindo o conteúdo mais recente já buscado."}
              </p>
            )}

            {items.map((item, index) => (
              <div key={`${item.source_url ?? item.title}-${index}`} className="rounded-xl bg-muted/30 p-3">
                <p className="text-sm font-medium leading-snug text-foreground">{item.title}</p>
                {item.summary && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {item.source_name ?? "Fonte"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">{item.source_name ?? "Fonte não informada"}</span>
                  )}
                  {formatSourceDate(item.published_at) && (
                    <Badge variant="secondary" className="rounded-full text-[11px] font-normal">
                      {formatSourceDate(item.published_at)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
