import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

export const BUCKET_MATRIZ = 'nr1-importacoes-matriz';
export const LINK_VALIDADE_S = 600;

export type StatusConferencia = 'pendente' | 'conferido' | 'rejeitado';

export interface Nr1Importacao {
  id: string;
  company_id: string;
  modo: 'arquivo' | 'texto';
  metodologia: string;
  metodologia_outra: string | null;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  consultoria: string | null;
  data_diagnostico: string | null;
  observacoes: string | null;
  status: string;
  mapeamento_resultado: Record<string, unknown> | null;
  mapeamento_aplicado: Record<string, unknown> | null;
  texto_livre: string | null;
  motivo_rejeicao: string | null;
  conferido_em: string | null;
  created_at: string;
}

/** Fora de pendente/conferido/rejeitado (estados legados), a tela trata como pendente. */
export const statusConferencia = (s: string): StatusConferencia =>
  s === 'conferido' || s === 'rejeitado' ? s : 'pendente';

export function useNr1Importacoes() {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ['nr1-importacoes', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('nr1_importacoes_matriz')
        .select('id,company_id,modo,metodologia,metodologia_outra,arquivo_path,arquivo_nome,consultoria,data_diagnostico,observacoes,status,mapeamento_resultado,mapeamento_aplicado,texto_livre,motivo_rejeicao,conferido_em,created_at')
        .eq('company_id', activeCompanyId)
        .order('created_at', { ascending: false });
      if (error) return [] as Nr1Importacao[]; // sem permissão: lista vazia, sem erro
      return (data ?? []) as Nr1Importacao[];
    },
  });
}

export function useConferirImportacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; status: 'conferido' | 'rejeitado'; motivo?: string }) => {
      const { data, error } = await (supabase as any)
        .from('nr1_importacoes_matriz')
        .update({ status: p.status, motivo_rejeicao: p.status === 'rejeitado' ? p.motivo?.trim() : null })
        .eq('id', p.id)
        .eq('status', 'pendente')
        .select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Esta importação não está mais pendente.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nr1-importacoes'] }),
  });
}

/** Link temporário (10 min), criado na hora; nunca guardado nem exportado. */
export async function abrirArquivoImportacao(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET_MATRIZ).createSignedUrl(path, LINK_VALIDADE_S);
  if (error || !data?.signedUrl) throw error ?? new Error('Arquivo indisponível');
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}
