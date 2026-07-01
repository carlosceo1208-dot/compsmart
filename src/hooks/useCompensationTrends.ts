import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/contexts/CompanyContext";

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

const CACHE_PREFIX = "compensation-trends:v2";
const MAX_RETRIES = 3;

// TTL is configurable via env (in hours). Default 24h. Min 1h, max 168h (7d).
const parsePositive = (v: unknown, fallback: number, min: number, max: number) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.max(n, min), max);
};

const TTL_HOURS = parsePositive(
  (import.meta as any)?.env?.VITE_COMPENSATION_TRENDS_TTL_HOURS,
  24,
  1,
  24 * 7
);
// Near-expiry threshold (in hours) — banner appears when remaining time <= this.
// Default 2h; capped to below TTL.
const NEAR_EXPIRY_HOURS = Math.min(
  parsePositive(
    (import.meta as any)?.env?.VITE_COMPENSATION_TRENDS_NEAR_EXPIRY_HOURS,
    2,
    0.25,
    TTL_HOURS
  ),
  TTL_HOURS - 0.01
);

export const CACHE_TTL_MS = TTL_HOURS * 60 * 60 * 1000;
export const NEAR_EXPIRY_MS = NEAR_EXPIRY_HOURS * 60 * 60 * 1000;

export const getCompensationTrendsCacheExpiry = (fetchedAt: number) => fetchedAt + CACHE_TTL_MS;
export const isCompensationTrendsCacheNearExpiry = (fetchedAt: number, now: number = Date.now()) =>
  getCompensationTrendsCacheExpiry(fetchedAt) - now <= NEAR_EXPIRY_MS;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Cache is scoped per company + query params to avoid leaking results across
// contexts (e.g. Super Admin switching companies, or different filters).
export const buildCompensationTrendsCacheKey = (scope: {
  companyId: string | null;
  params?: Record<string, unknown>;
}) => {
  const paramsKey = scope.params
    ? JSON.stringify(
        Object.keys(scope.params)
          .sort()
          .reduce<Record<string, unknown>>((acc, k) => {
            acc[k] = scope.params![k];
            return acc;
          }, {})
      )
    : "{}";
  return `${CACHE_PREFIX}:${scope.companyId ?? "anon"}:${paramsKey}`;
};

export const readCompensationTrendsCache = (key: string): CompensationTrendsResult | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompensationTrendsResult;
    if (!parsed?.trends?.length) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writeCompensationTrendsCache = (key: string, result: CompensationTrendsResult) => {
  try {
    localStorage.setItem(key, JSON.stringify(result));
  } catch {
    /* ignore quota errors */
  }
};

export const clearCompensationTrendsCache = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

// Internal aliases (kept short for the rest of the file).
const buildCacheKey = buildCompensationTrendsCacheKey;
const readCache = readCompensationTrendsCache;
const writeCache = writeCompensationTrendsCache;

const isRateLimit = (err: unknown): boolean => {
  const anyErr = err as any;
  const status = anyErr?.status ?? anyErr?.context?.status ?? anyErr?.response?.status;
  if (status === 429) return true;
  const msg = String(anyErr?.message || "").toLowerCase();
  return msg.includes("429") || msg.includes("rate limit");
};

const fetchTrends = async (
  cacheKey: string,
  params?: Record<string, unknown>
): Promise<CompensationTrendsResult> => {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke<TrendsResponse>(
        "compensation-trends",
        params ? { body: params } : undefined
      );
      if (error) throw error;
      if (data?.error && !data?.trends?.length) throw new Error(data.error);

      const result: CompensationTrendsResult = {
        trends: data?.trends || [],
        isFallback: Boolean(data?.fallback),
        fallbackReason: data?.fallback ? "rate_limit" : undefined,
        fetchedAt: Date.now(),
      };
      if (result.trends.length) writeCache(cacheKey, result);
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
  const cached = readCache(cacheKey);
  if (cached?.trends?.length) {
    return {
      ...cached,
      isFallback: true,
      fallbackReason: isRateLimit(lastError) ? "rate_limit" : "error",
    };
  }
  throw lastError instanceof Error ? lastError : new Error("Erro ao buscar tendências");
};

export const useCompensationTrends = (params?: Record<string, unknown>) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  const cacheKey = buildCacheKey({ companyId: activeCompanyId, params });
  const cached = readCache(cacheKey);
  const cacheFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS ? cached : undefined;

  const query = useQuery<CompensationTrendsResult>({
    queryKey: ["compensation-trends", activeCompanyId, params ?? null],
    queryFn: () => fetchTrends(cacheKey, params),
    staleTime: CACHE_TTL_MS,
    gcTime: CACHE_TTL_MS,
    retry: false, // handled internally with backoff
    refetchOnWindowFocus: false,
    initialData: cacheFresh,
    initialDataUpdatedAt: cacheFresh?.fetchedAt,
  });

  const refetch = async () => {
    try {
      // Drop the persisted cache so we don't fall back to stale data
      // if the network call happens to fail.
      clearCompensationTrendsCache(cacheKey);
      await queryClient.invalidateQueries({
        queryKey: ["compensation-trends", activeCompanyId, params ?? null],
      });
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
