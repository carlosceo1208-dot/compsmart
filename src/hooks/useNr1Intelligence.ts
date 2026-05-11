import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import type { TalentIntelRow } from './useTalentIntelligence';
import type { Diagnostico, Dimensao } from '@/lib/nr1';

export interface Nr1IntelligenceFilters {
  startDate?: string; // ISO date
  endDate?: string;
  unitId?: string | 'all';
}

export interface UnitCrossInsight {
  unitId: string | null;
  unitName: string;
  totalColab: number;
  criticos9Box: number; // boxes 1, 2, 3
  estrelas9Box: number; // boxes 7, 8, 9
  avgPerformance: number | null;
  avgPotential: number | null;
  avgSalary: number | null;
  riskScore: number | null; // herda do diagnóstico empresa (mesmo valor)
  alertas: string[];
}

export const useNr1Intelligence = (filters: Nr1IntelligenceFilters) => {
  const { activeCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['nr1-intel', activeCompanyId, filters],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      // 1) Diagnósticos NR-1 do período
      let dq = supabase
        .from('nr1_diagnosticos')
        .select('*')
        .eq('company_id', activeCompanyId!)
        .eq('status', 'concluido')
        .order('created_at', { ascending: false });
      if (filters.startDate) dq = dq.gte('periodo_fim', filters.startDate);
      if (filters.endDate) dq = dq.lte('periodo_fim', filters.endDate);
      const { data: diagsData, error: dErr } = await dq;
      if (dErr) throw dErr;
      const diagnosticos = (diagsData ?? []) as Diagnostico[];
      const ultimo = diagnosticos[0] ?? null;

      // 2) Talent intelligence (já filtra por root_company via RLS)
      const { data: talentData, error: tErr } = await supabase
        .from('v_talent_intelligence_dashboard' as any)
        .select('*')
        .limit(1000);
      if (tErr) throw tErr;
      let talent = (talentData ?? []) as unknown as TalentIntelRow[];
      if (filters.unitId && filters.unitId !== 'all') {
        talent = talent.filter((t) => t.unit_id === filters.unitId);
      }

      // 3) Unidades (para nomes) — RLS já filtra por root_company_id
      const { data: unitsData } = await supabase
        .from('organizational_structure')
        .select('id, name, type')
        .neq('type', 'company');
      const unitMap = new Map((unitsData ?? []).map((u) => [u.id, u.name]));

      // 4) Agregação por unidade
      const byUnit = new Map<string | null, TalentIntelRow[]>();
      talent.forEach((row) => {
        const k = row.unit_id ?? null;
        if (!byUnit.has(k)) byUnit.set(k, []);
        byUnit.get(k)!.push(row);
      });

      const riscoEmpresa = ultimo?.score_geral != null ? Number(ultimo.score_geral) : null;

      const unitInsights: UnitCrossInsight[] = Array.from(byUnit.entries()).map(([uid, rows]) => {
        const totalColab = rows.length;
        const criticos = rows.filter((r) => r.box_position && r.box_position <= 3).length;
        const estrelas = rows.filter((r) => r.box_position && r.box_position >= 7).length;
        const perfs = rows.map((r) => r.performance_score).filter((v): v is number => v != null);
        const pots = rows.map((r) => r.potential_score).filter((v): v is number => v != null);
        const sals = rows.map((r) => r.current_salary).filter((v): v is number => v != null);
        const avg = (a: number[]) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : null);

        const alertas: string[] = [];
        if (riscoEmpresa != null && riscoEmpresa >= 50 && criticos / Math.max(totalColab, 1) > 0.2) {
          alertas.push('Risco psicossocial alto + concentração de talentos críticos: priorizar plano de ação.');
        }
        if (riscoEmpresa != null && riscoEmpresa >= 50 && estrelas > 0) {
          alertas.push(`${estrelas} talento(s) estratégico(s) em ambiente de risco — risco de turnover.`);
        }
        const avgPerf = avg(perfs);
        if (avgPerf != null && avgPerf < 3 && riscoEmpresa != null && riscoEmpresa >= 50) {
          alertas.push('Performance média baixa correlacionada a risco psicossocial elevado.');
        }

        return {
          unitId: uid,
          unitName: uid ? unitMap.get(uid) ?? 'Unidade sem nome' : 'Sem unidade',
          totalColab,
          criticos9Box: criticos,
          estrelas9Box: estrelas,
          avgPerformance: avgPerf,
          avgPotential: avg(pots),
          avgSalary: avg(sals),
          riskScore: riscoEmpresa,
          alertas,
        };
      });

      // 5) KPIs gerais
      const totalColab = talent.length;
      const totalCriticos = talent.filter((r) => r.box_position && r.box_position <= 3).length;
      const totalEstrelas = talent.filter((r) => r.box_position && r.box_position >= 7).length;
      const avgSalGeral =
        talent.filter((r) => r.current_salary).reduce((s, r) => s + (r.current_salary ?? 0), 0) /
        Math.max(talent.filter((r) => r.current_salary).length, 1);

      // Estimativa de custo de turnover: 30% folha anual dos talentos em risco
      const estrelasEmRisco =
        riscoEmpresa != null && riscoEmpresa >= 50
          ? talent.filter((r) => r.box_position && r.box_position >= 7 && r.current_salary)
          : [];
      const custoTurnoverEstimado = estrelasEmRisco.reduce(
        (s, r) => s + (r.current_salary ?? 0) * 13.33 * 0.3,
        0,
      );

      const dimensoes =
        ultimo?.scores_dimensao && typeof ultimo.scores_dimensao === 'object'
          ? (ultimo.scores_dimensao as Record<Dimensao, number>)
          : null;

      return {
        diagnosticos,
        ultimo,
        riscoEmpresa,
        dimensoes,
        kpis: { totalColab, totalCriticos, totalEstrelas, avgSalGeral, custoTurnoverEstimado },
        unitInsights: unitInsights.sort((a, b) => b.totalColab - a.totalColab),
        units: Array.from(unitMap.entries()).map(([id, name]) => ({ id, name })),
      };
    },
  });
};
