import { Badge } from "@/components/ui/badge";
import { useMarketInsights } from "@/hooks/useMarketInsights";
import { ExternalLink, Quote } from "lucide-react";

const formatSourceDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

/**
 * Uma única referência externa (conteúdo público de mercado) para contextualizar
 * a análise interna. Nunca mistura dados do cliente e não aparece quando não há
 * referência confiável disponível para o tema.
 */
export const MarketReferenceNote = ({ topic }: { topic: string }) => {
  const { items, isLoading, error } = useMarketInsights(topic);

  if (isLoading || error) return null;
  const item = items.find((i) => i.source_url && (i.summary || i.title));
  if (!item) return null;

  const date = formatSourceDate(item.published_at);

  return (
    <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Quote className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">
          Referência externa de mercado (conteúdo público)
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {item.summary || item.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <a
          href={item.source_url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {item.source_name ?? "Fonte"}
          <ExternalLink className="h-3 w-3" />
        </a>
        {date && (
          <Badge variant="secondary" className="rounded-full text-[11px] font-normal">
            {date}
          </Badge>
        )}
        <span className="text-[11px] text-muted-foreground">
          Conteúdo público externo — não reflete dados da sua empresa.
        </span>
      </div>
    </div>
  );
};
