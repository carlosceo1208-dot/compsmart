import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CompensationTrend {
  title: string;
  summary: string;
  source: string;
  category: "salários" | "benefícios" | "trabalho_remoto" | "tecnologia" | "liderança";
  detailed_analysis?: string;
  impact?: string;
  recommendations?: string[];
  search_terms?: string[];
}

interface TrendsResponse {
  trends: CompensationTrend[];
  error?: string;
  fallback?: boolean;
}

export interface CompensationTrendsResult {
  trends: CompensationTrend[];
  isFallback: boolean;
  fallbackReason?: "rate_limit" | "error";
  fetchedAt: number;
}

const CACHE_KEY = "compensation-trends:v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const readCache = (): CompensationTrendsResult | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompensationTrendsResult;
    if (!parsed?.trends?.length) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (result: CompensationTrendsResult) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
  } catch {
    /* ignore quota errors */
  }
};

const isRateLimit = (err: unknown): boolean => {
  const anyErr = err as any;
  const status = anyErr?.status ?? anyErr?.context?.status ?? anyErr?.response?.status;
  if (status === 429) return true;
  const msg = String(anyErr?.message || "").toLowerCase();
  return msg.includes("429") || msg.includes("rate limit");
};

const fetchTrends = async (): Promise<CompensationTrendsResult> => {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke<TrendsResponse>("compensation-trends");
      if (error) throw error;
      if (data?.error && !data?.trends?.length) throw new Error(data.error);

      const result: CompensationTrendsResult = {
        trends: data?.trends || [],
        isFallback: Boolean(data?.fallback),
        fallbackReason: data?.fallback ? "rate_limit" : undefined,
        fetchedAt: Date.now(),
      };
      if (result.trends.length) writeCache(result);
      return result;
    } catch (err) {
      lastError = err;
      if (isRateLimit(err) && attempt < MAX_RETRIES - 1) {
        const delay = 1000 * Math.pow(2, attempt) + Math.random() * 250;
        console.warn(`[trends] 429 — retry ${attempt + 1} in ${Math.round(delay)}ms`);
        await sleep(delay);
        continue;
      }
      break;
    }
  }

  // Fall back to cache if we have it
  const cached = readCache();
  if (cached?.trends?.length) {
    return {
      ...cached,
      isFallback: true,
      fallbackReason: isRateLimit(lastError) ? "rate_limit" : "error",
    };
  }
  throw lastError instanceof Error ? lastError : new Error("Erro ao buscar tendências");
};

export const useCompensationTrends = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cached = readCache();
  const cacheFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS ? cached : undefined;

  const query = useQuery<CompensationTrendsResult>({
    queryKey: ["compensation-trends"],
    queryFn: fetchTrends,
    staleTime: CACHE_TTL_MS,
    gcTime: CACHE_TTL_MS,
    retry: false, // handled internally with backoff
    refetchOnWindowFocus: false,
    initialData: cacheFresh,
    initialDataUpdatedAt: cacheFresh?.fetchedAt,
  });

  const refetch = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ["compensation-trends"] });
      toast({
        title: "Tendências atualizadas",
        description: "As tendências de gestão de remuneração foram atualizadas com sucesso.",
      });
    } catch {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as tendências. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return {
    trends: query.data?.trends || [],
    isFallback: Boolean(query.data?.isFallback),
    fallbackReason: query.data?.fallbackReason,
    fetchedAt: query.data?.fetchedAt,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    isFetching: query.isFetching,
  };
};
