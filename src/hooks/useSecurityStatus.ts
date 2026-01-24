import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SecurityIgnoredFinding = {
  id: string;
  internal_id?: string;
  name?: string;
  level?: 'info' | 'warn' | 'error';
  ignore?: boolean;
  ignore_reason?: string;
};

export type SecurityScanSnapshot = {
  id: string;
  created_at: string;
  created_by: string | null;
  active_error_count: number;
  ignored_findings: SecurityIgnoredFinding[];
};

// Fallback baseado no resultado atual do scanner (somente itens level="error").
// Observação: o scanner pode retornar outros níveis (warn/info), mas por decisão
// do produto, este painel ignora tudo que não for "error".
export const DEFAULT_ERROR_FINDINGS: SecurityIgnoredFinding[] = [
  {
    id: 'KNOWN_DEPENDENCY_VULNERABILITIES',
    internal_id: 'react_18_3_1_xss_vuln',
    name: 'React 18.3.1 XSS vulnerability (false positive)',
    level: 'error',
    ignore: true,
    ignore_reason:
      'False positive: React 18.3.2 não existe; CVEs citados afetam React 19 RSC. Este app é React 18 client-side (Vite).',
  },
  {
    id: 'vulnerable_dependencies_critical',
    internal_id: 'vulnerable_dependencies_critical',
    name: 'Critical vulnerabilities in application dependencies (jsPDF)',
    level: 'error',
    ignore: true,
    ignore_reason:
      'Not applicable: vulnerabilidade do jsPDF afeta build Node.js (path traversal). Este app usa jsPDF somente no browser (Vite/React).',
  },
];

export function useSecurityStatus() {
  return useQuery({
    queryKey: ['security-status-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_scan_latest')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return null;

      return {
        id: data.id,
        created_at: data.created_at,
        created_by: data.created_by,
        active_error_count: data.active_error_count,
        ignored_findings: (data.ignored_findings || []) as SecurityIgnoredFinding[],
      } as SecurityScanSnapshot;
    },
    refetchInterval: 60000,
  });
}

export function useRegisterSecurityScanSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Somente itens level="error" entram no snapshot.
      const errorFindings = DEFAULT_ERROR_FINDINGS.filter(f => (f.level ?? 'error') === 'error');
      const active_error_count = errorFindings.filter(f => !f.ignore).length;

      const { data, error } = await supabase
        .from('security_scan_snapshots')
        .insert({
          created_by: userData.user.id,
          active_error_count,
          ignored_findings: errorFindings,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as SecurityScanSnapshot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-status-latest'] });
      toast.success('Scan registrado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao registrar scan');
    },
  });
}
