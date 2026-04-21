import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EquityRow {
  root_company_id: string;
  job_title: string | null;
  grade: string | null;
  gender?: string;
  race_ethnicity?: string;
  employee_count: number;
  avg_salary: number;
  median_salary: number;
}

export interface PayEquityAlert {
  id: string;
  alert_type: string;
  job_title: string | null;
  grade: string | null;
  group_a_label: string;
  group_b_label: string;
  group_a_avg_salary: number | null;
  group_b_avg_salary: number | null;
  gap_percentage: number | null;
  affected_count: number | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  resolution_notes: string | null;
  created_at: string;
}

export function usePayEquityByGender() {
  return useQuery({
    queryKey: ['pay-equity-gender'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_pay_equity_by_gender' as any).select('*');
      if (error) throw error;
      return (data ?? []) as unknown as EquityRow[];
    },
  });
}

export function usePayEquityByRace() {
  return useQuery({
    queryKey: ['pay-equity-race'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_pay_equity_by_race' as any).select('*');
      if (error) throw error;
      return (data ?? []) as unknown as EquityRow[];
    },
  });
}

export function usePayEquityAlerts() {
  return useQuery({
    queryKey: ['pay-equity-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pay_equity_alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayEquityAlert[];
    },
  });
}

/**
 * Calcula gaps cruzando dados por gênero/raça e gera alertas para gaps > 5%
 */
export function useDetectEquityGaps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Buscar dados agregados
      const [{ data: genderData }, { data: raceData }] = await Promise.all([
        supabase.from('v_pay_equity_by_gender' as any).select('*'),
        supabase.from('v_pay_equity_by_race' as any).select('*'),
      ]);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user!.id)
        .single();

      const alerts: any[] = [];

      // Detectar gaps de gênero por cargo
      const genderByJob = new Map<string, any[]>();
      (genderData as any[] ?? []).forEach((r) => {
        const key = `${r.job_title}__${r.grade}`;
        if (!genderByJob.has(key)) genderByJob.set(key, []);
        genderByJob.get(key)!.push(r);
      });
      genderByJob.forEach((rows, key) => {
        if (rows.length < 2) return;
        const fem = rows.find((r) => r.gender === 'feminino');
        const masc = rows.find((r) => r.gender === 'masculino');
        if (!fem || !masc) return;
        const gap = ((Number(masc.avg_salary) - Number(fem.avg_salary)) / Number(masc.avg_salary)) * 100;
        if (Math.abs(gap) >= 5) {
          alerts.push({
            root_company_id: profile!.root_company_id,
            alert_type: 'gender_gap',
            job_title: rows[0].job_title,
            grade: rows[0].grade,
            group_a_label: 'Masculino',
            group_b_label: 'Feminino',
            group_a_avg_salary: masc.avg_salary,
            group_b_avg_salary: fem.avg_salary,
            gap_percentage: Number(gap.toFixed(2)),
            affected_count: Number(fem.employee_count) + Number(masc.employee_count),
            severity: Math.abs(gap) >= 20 ? 'critical' : Math.abs(gap) >= 10 ? 'high' : 'medium',
            status: 'open',
          });
        }
      });

      // Detectar gaps por raça
      const raceByJob = new Map<string, any[]>();
      (raceData as any[] ?? []).forEach((r) => {
        const key = `${r.job_title}__${r.grade}`;
        if (!raceByJob.has(key)) raceByJob.set(key, []);
        raceByJob.get(key)!.push(r);
      });
      raceByJob.forEach((rows) => {
        if (rows.length < 2) return;
        const branca = rows.find((r) => r.race_ethnicity === 'branca');
        const negra = rows.filter((r) => r.race_ethnicity === 'preta' || r.race_ethnicity === 'parda');
        if (!branca || negra.length === 0) return;
        const negraAvg =
          negra.reduce((s, r) => s + Number(r.avg_salary) * Number(r.employee_count), 0) /
          negra.reduce((s, r) => s + Number(r.employee_count), 0);
        const gap = ((Number(branca.avg_salary) - negraAvg) / Number(branca.avg_salary)) * 100;
        if (Math.abs(gap) >= 5) {
          alerts.push({
            root_company_id: profile!.root_company_id,
            alert_type: 'race_gap',
            job_title: rows[0].job_title,
            grade: rows[0].grade,
            group_a_label: 'Branca',
            group_b_label: 'Preta/Parda',
            group_a_avg_salary: branca.avg_salary,
            group_b_avg_salary: negraAvg,
            gap_percentage: Number(gap.toFixed(2)),
            affected_count: Number(branca.employee_count) + negra.reduce((s, r) => s + Number(r.employee_count), 0),
            severity: Math.abs(gap) >= 20 ? 'critical' : Math.abs(gap) >= 10 ? 'high' : 'medium',
            status: 'open',
          });
        }
      });

      if (alerts.length === 0) return { count: 0 };

      const { error } = await supabase.from('pay_equity_alerts').insert(alerts);
      if (error) throw error;
      return { count: alerts.length };
    },
    onSuccess: (r) => {
      toast.success(`${r.count} alertas detectados`);
      qc.invalidateQueries({ queryKey: ['pay-equity-alerts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateEquityAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: string; resolution_notes?: string }) => {
      const { error } = await supabase
        .from('pay_equity_alerts')
        .update({
          status: params.status,
          resolution_notes: params.resolution_notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alerta atualizado');
      qc.invalidateQueries({ queryKey: ['pay-equity-alerts'] });
    },
  });
}
