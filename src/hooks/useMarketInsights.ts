import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export interface MarketInsightItem {
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
  published_at: string | null;
}

export interface MarketInsightsResult {
  topic: string;
  topic_label: string;
  question: string;
  items: MarketInsightItem[];
  fetched_at?: string;
  from_cache?: boolean;
  rate_limited?: boolean;
  stale?: boolean;
}

/** Temas usados pelo módulo Insight (mesma função Edge e mesmo cache do painel). */
export const INSIGHT_TOPICS = [
  { value: "dissidios_setor", label: "Movimentações salariais e dissídios por setor" },
  { value: "inflacao_remuneracao", label: "Inflação e impacto em remuneração" },
  { value: "beneficios_total", label: "Benefícios e remuneração total" },
  { value: "praticas_cargo_regiao", label: "Práticas de mercado por cargo e região" },
] as const;

async function callFunction(topic: string, refresh: boolean): Promise<MarketInsightsResult> {
  const { data, error } = await supabase.functions.invoke("market-insights", {
    body: { topic, refresh },
  });

  if (error) {
    let message = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        message = body?.error ?? message;
      } catch {
        // mantém a mensagem original
      }
    }
    throw new Error(message);
  }

  return data as MarketInsightsResult;
}

export function useMarketInsights(topic = "mercado_rh") {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["market-insights", topic],
    queryFn: () => callFunction(topic, false),
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  const refresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const data = await callFunction(topic, true);
      queryClient.setQueryData(["market-insights", topic], data);
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Não foi possível atualizar agora.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    data: query.data,
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refreshError,
    isRefreshing,
    refresh,
    refetch: query.refetch,
  };
}
