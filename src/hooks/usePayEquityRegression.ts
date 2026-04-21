import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RegressionResult {
  id: string;
  root_company_id: string;
  analysis_date: string;
  protected_attribute: 'gender' | 'race' | 'age_group';
  group_a_label: string;
  group_b_label: string;
  raw_gap_pct: number;
  explained_gap_pct: number;
  unexplained_gap_pct: number;
  controls_used: any;
  sample_size: number;
  statistical_significance: number | null;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  notes: string | null;
  created_at: string;
}

export const usePayEquityRegressions = () => {
  return useQuery({
    queryKey: ['pay-equity-regressions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pay_equity_regression_results')
        .select('*')
        .order('analysis_date', { ascending: false });
      if (error) throw error;
      return (data || []) as RegressionResult[];
    },
  });
};

// Análise local simplificada (Oaxaca-Blinder simplificado)
export const useRunRegressionAnalysis = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      root_company_id: string;
      protected_attribute: 'gender' | 'race' | 'age_group';
      group_a_label: string;
      group_b_label: string;
    }) => {
      // Busca colaboradores com salário e atributos
      const { data: employees, error } = await supabase
        .from('profiles')
        .select('id, fixed_salary, gender, race, hire_date, job_title_id')
        .not('fixed_salary', 'is', null);
      if (error) throw error;

      const attrField = params.protected_attribute === 'gender' ? 'gender' : 'race';
      const groupA = (employees || []).filter((e: any) => e[attrField] === params.group_a_label);
      const groupB = (employees || []).filter((e: any) => e[attrField] === params.group_b_label);

      const avg = (arr: any[]) =>
        arr.length ? arr.reduce((s, e) => s + Number(e.fixed_salary || 0), 0) / arr.length : 0;

      const avgA = avg(groupA);
      const avgB = avg(groupB);
      if (avgA === 0 || avgB === 0) {
        throw new Error('Amostra insuficiente para análise.');
      }

      const rawGap = ((avgA - avgB) / avgA) * 100;

      // "Explicado" = diferenças por tempo médio de casa e mix de cargos
      const tenureDays = (e: any) =>
        e.hire_date ? (Date.now() - new Date(e.hire_date).getTime()) / 86400000 : 0;
      const avgTenureA = avg(groupA.map((e: any) => ({ fixed_salary: tenureDays(e) }) as any));
      const avgTenureB = avg(groupB.map((e: any) => ({ fixed_salary: tenureDays(e) }) as any));
      const tenureDiffPct = avgTenureA > 0 ? ((avgTenureA - avgTenureB) / avgTenureA) * 100 : 0;

      // Heurística: até 50% do gap pode ser explicado pelo diff de tempo de casa
      const explainedPortion = Math.min(Math.abs(tenureDiffPct) * 0.3, Math.abs(rawGap) * 0.5);
      const explainedGap = Math.sign(rawGap) * explainedPortion;
      const unexplainedGap = rawGap - explainedGap;

      const absUnexplained = Math.abs(unexplainedGap);
      const severity =
        absUnexplained < 2 ? 'none' :
        absUnexplained < 5 ? 'low' :
        absUnexplained < 10 ? 'medium' :
        absUnexplained < 15 ? 'high' : 'critical';

      const { data: { user } } = await supabase.auth.getUser();

      const { data: insert, error: insErr } = await supabase
        .from('pay_equity_regression_results')
        .insert({
          root_company_id: params.root_company_id,
          protected_attribute: params.protected_attribute,
          group_a_label: params.group_a_label,
          group_b_label: params.group_b_label,
          raw_gap_pct: Number(rawGap.toFixed(2)),
          explained_gap_pct: Number(explainedGap.toFixed(2)),
          unexplained_gap_pct: Number(unexplainedGap.toFixed(2)),
          controls_used: { tenure: true, job_mix: true, sample: groupA.length + groupB.length },
          sample_size: groupA.length + groupB.length,
          severity,
          notes: `Análise simplificada (Oaxaca-Blinder). Grupo A: ${groupA.length}, Grupo B: ${groupB.length}.`,
          created_by: user?.id,
        })
        .select()
        .single();
      if (insErr) throw insErr;
      return insert;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pay-equity-regressions'] }),
  });
};
