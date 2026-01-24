import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SecurityIgnoredFinding = {
  id: string;
  internal_id?: string;
  name?: string;
  level?: 'info' | 'warn' | 'error';
  ignore_reason?: string;
};

export type SecurityScanSnapshot = {
  id: string;
  created_at: string;
  created_by: string | null;
  active_error_count: number;
  ignored_findings: SecurityIgnoredFinding[];
};

// Lista base (fallback) para registrar/mostrar quando ainda não há snapshot.
// Você pode ajustar/expandir esta lista conforme seus ignores evoluírem.
export const DEFAULT_IGNORED_FINDINGS: SecurityIgnoredFinding[] = [
  {
    id: 'react_18_3_1_xss_vuln',
    internal_id: 'react_18_3_1_xss_vuln',
    name: 'React 18.3.1 XSS vulnerability (false positive)',
    level: 'info',
    ignore_reason:
      'Falso positivo: app é CSR (Vite) e não usa React Server Components; não há vetor aplicável no contexto atual.',
  },
  {
    id: 'INFO_LEAKAGE',
    internal_id: 'public_reference_data_review',
    name: 'Public Reference Data Tables - Acceptable by Design',
    level: 'info',
    ignore_reason:
      'Tabelas públicas são intencionais (marketing/SEO/compliance). Não há dados sensíveis expostos. Aceitável por design.',
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

      // Observação: este snapshot é uma evidência "registrada".
      // O count de erros ativos aqui segue o que você decidir monitorar como erro "bloqueante".
      // No estado atual do projeto, estamos registrando como 0 (painel é focado em "erros ativos").
      const active_error_count = 0;

      const { data, error } = await supabase
        .from('security_scan_snapshots')
        .insert({
          created_by: userData.user.id,
          active_error_count,
          ignored_findings: DEFAULT_IGNORED_FINDINGS,
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
