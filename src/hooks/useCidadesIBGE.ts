import { useQuery } from "@tanstack/react-query";

const TTL = 7 * 24 * 60 * 60 * 1000;

/** Municípios de uma UF via API pública do IBGE, com cache de 24h (memória) e 7 dias (navegador). */
export const useCidadesIBGE = (uf?: string | null) =>
  useQuery({
    queryKey: ["ibge-cidades", uf],
    enabled: !!uf,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<string[]> => {
      const key = `ibge-cidades-${uf}`;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const c = JSON.parse(raw) as { t: number; d: string[] };
          if (Date.now() - c.t < TTL) return c.d;
        }
      } catch { /* cache inválido */ }
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      if (!res.ok) throw new Error("IBGE indisponível");
      const d = ((await res.json()) as { nome: string }[]).map((m) => m.nome);
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch { /* sem espaço */ }
      return d;
    },
  });
