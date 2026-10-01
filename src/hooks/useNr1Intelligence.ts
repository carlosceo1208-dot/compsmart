import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { custoTurnover, seloSaude } from '@/lib/nr1Selo';

export interface Nr1IntelligenceFilters {
  startDate?: string;
  endDate?: string;
  unitId?: string | 'all';
}

export interface UnitCrossInsight {
  unitId: string | null;
  unitName: string;
  totalColab: number;
  criticos9Box: number | null;
  estrelas9Box: number | null;
  avgPerformance: number | null;
  avgSalary: number | null;
  salarioMedioEstrelas: number | null;
  saude: number | null; // herdada do diagnóstico da empresa
  custoTurnover: number;
  causaRaiz: boolean;
  alertas: string[];
}

export interface GrupoInsight { grupo: string; pessoas: number; saude: number | null }

type RpcResult = {
  acesso: 'ok' | 'negado';
  inclui_potencial?: boolean;
  inclui_remuneracao?: boolean;
  diagnostico: { id: string; nome: string; risco: number | null; saude: number | null; dimensoes: Record<string, number> | null; respondentes: number } | null;
  unidades: Array<{ unit_id: string | null; unit_name: string; pessoas: number; criticos: number | null; estrelas: number | null; perf_media: number | null; salario_medio: number | null; salario_medio_estrelas: number | null }>;
  unidades_ocultas: number;
  grupos: GrupoInsight[];
  grupos_ocultos: number;
};

/** A7: causa raiz confirmada → Crítico com estrelas em risco → custo de turnover desc → mais colaboradores. */
export function ordenarPrioridades(units: UnitCrossInsight[]): UnitCrossInsight[] {
  const rank = (u: UnitCrossInsight) =>
    u.causaRaiz ? 0 : seloSaude(u.saude)?.key === 'critico' && (u.estrelas9Box ?? 0) > 0 ? 1 : 2;
  return [...units].sort((a, b) => rank(a) - rank(b) || b.custoTurnover - a.custoTurnover || b.totalColab - a.totalColab);
}

export const useNr1Intelligence = (filters: Nr1IntelligenceFilters, causaRaizEmpresa = false) => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ['nr1-intel', activeCompanyId, filters.startDate, filters.endDate, causaRaizEmpresa],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('nr1_inteligencia_unidades', {
        p_company: activeCompanyId, p_inicio: filters.startDate || null, p_fim: filters.endDate || null,
      });
      if (error) throw error;
      const r = data as RpcResult;
      if (!r || r.acesso !== 'ok') return null;
      const saude = r.diagnostico?.saude ?? null;
      const units: UnitCrossInsight[] = (r.unidades ?? []).map((u) => {
        const custo = custoTurnover(u.estrelas, u.salario_medio_estrelas, saude);
        const selo = seloSaude(saude);
        const alertas: string[] = [];
        if (selo && selo.key !== 'saudavel' && (u.criticos ?? 0) / Math.max(u.pessoas, 1) > 0.2)
          alertas.push('Risco psicossocial + concentração de talentos críticos: priorizar plano de ação.');
        if (selo && selo.key !== 'saudavel' && (u.estrelas ?? 0) > 0)
          alertas.push(`${u.estrelas} talento(s) estratégico(s) em ambiente de risco — risco de saída.`);
        if (selo && selo.key !== 'saudavel' && u.perf_media != null && u.perf_media < 3)
          alertas.push('Desempenho médio baixo junto de risco psicossocial.');
        return {
          unitId: u.unit_id, unitName: u.unit_name, totalColab: u.pessoas,
          criticos9Box: u.criticos, estrelas9Box: u.estrelas, avgPerformance: u.perf_media,
          avgSalary: u.salario_medio, salarioMedioEstrelas: u.salario_medio_estrelas,
          saude, custoTurnover: custo, causaRaiz: causaRaizEmpresa && selo?.key === 'critico', alertas,
        };
      });
      const filtered = filters.unitId && filters.unitId !== 'all' ? units.filter((u) => u.unitId === filters.unitId) : units;
      return {
        diagnostico: r.diagnostico,
        saude,
        incluiPotencial: !!r.inclui_potencial,
        incluiRemuneracao: !!r.inclui_remuneracao,
        allUnits: units,
        unitInsights: ordenarPrioridades(filtered),
        unidadesOcultas: r.unidades_ocultas ?? 0,
        grupos: r.grupos ?? [],
        gruposOcultos: r.grupos_ocultos ?? 0,
        custoTotal: filtered.reduce((s, u) => s + u.custoTurnover, 0),
      };
    },
  });
};
