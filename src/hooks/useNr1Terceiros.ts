import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export interface Terceiro {
  id: string;
  company_id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  num_colaboradores: number | null;
  area_atuacao: string | null;
  observacoes: string | null;
  ativo: boolean;
  /** Grau de risco NR-4 (1–4). */
  grau_risco: number | null;
  emergencia_nome: string | null;
  emergencia_telefone: string | null;
  emergencia_email: string | null;
  /** Início do contrato (YYYY-MM-DD). */
  contrato_inicio: string | null;
  created_at: string;
  updated_at: string;
}

export interface TerceiroPgr {
  id: string;
  terceiro_id: string;
  company_id: string;
  versao: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  data_emissao: string | null;
  data_vencimento: string | null;
  observacoes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export function useNr1Terceiros() {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ['nr1-terceiros', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async (): Promise<Terceiro[]> => {
      const { data, error } = await (supabase as any)
        .from('nr1_terceiros')
        .select('*')
        .eq('company_id', activeCompanyId)
        .order('razao_social', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Terceiro[];
    },
  });
}

export function useNr1TerceiroPgrs(terceiroId: string | null) {
  return useQuery({
    queryKey: ['nr1-terceiro-pgrs', terceiroId],
    enabled: !!terceiroId,
    queryFn: async (): Promise<TerceiroPgr[]> => {
      const { data, error } = await (supabase as any)
        .from('nr1_terceiros_pgr')
        .select('*')
        .eq('terceiro_id', terceiroId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TerceiroPgr[];
    },
  });
}

export function useUpsertTerceiro() {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async (input: Partial<Terceiro> & { id?: string }): Promise<{ id: string }> => {
      if (!activeCompanyId) throw new Error('Selecione uma empresa ativa.');
      const payload: any = { ...input, company_id: activeCompanyId };
      if (input.id) {
        const { error } = await (supabase as any)
          .from('nr1_terceiros').update(payload).eq('id', input.id);
        if (error) throw error;
        return { id: input.id };
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        payload.created_by = user?.id;
        const { data, error } = await (supabase as any)
          .from('nr1_terceiros').insert(payload).select('id').single();
        if (error) throw error;
        return { id: data.id };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nr1-terceiros'] });
      toast.success('Empresa salva com sucesso');
    },
    onError: (e: any) => {
      const msg = e?.message?.includes('duplicate') || e?.code === '23505'
        ? 'CNPJ já cadastrado para esta empresa.'
        : e?.message ?? 'Erro ao salvar';
      toast.error(msg);
    },
  });
}

export function useDeleteTerceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('nr1_terceiros').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nr1-terceiros'] });
      toast.success('Empresa removida');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao excluir'),
  });
}

export function useUploadPgr() {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async (params: {
      terceiroId: string;
      file: File;
      versao: string;
      data_emissao?: string;
      data_vencimento?: string;
      observacoes?: string;
    }) => {
      if (!activeCompanyId) throw new Error('Empresa ativa não definida.');
      const { data: { user } } = await supabase.auth.getUser();
      const ts = Date.now();
      const safeName = params.file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${activeCompanyId}/${params.terceiroId}/${ts}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from('nr1-pgr-docs')
        .upload(path, params.file, { contentType: params.file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await (supabase as any).from('nr1_terceiros_pgr').insert({
        terceiro_id: params.terceiroId,
        company_id: activeCompanyId,
        versao: params.versao,
        file_path: path,
        file_name: params.file.name,
        file_size: params.file.size,
        mime_type: params.file.type,
        data_emissao: params.data_emissao || null,
        data_vencimento: params.data_vencimento || null,
        observacoes: params.observacoes || null,
        uploaded_by: user?.id,
      });
      if (insErr) throw insErr;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['nr1-terceiro-pgrs', vars.terceiroId] });
      qc.invalidateQueries({ queryKey: ['nr1-terceiros'] });
      toast.success('PGR enviado com sucesso');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao enviar PGR'),
  });
}

export async function downloadPgr(filePath: string, fileName: string) {
  const { data, error } = await supabase.storage
    .from('nr1-pgr-docs')
    .createSignedUrl(filePath, 60);
  if (error || !data?.signedUrl) {
    toast.error('Não foi possível gerar link de download');
    return;
  }
  const a = document.createElement('a');
  a.href = data.signedUrl;
  a.download = fileName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export type TerceiroStatus = 'ok' | 'vencendo' | 'vencido' | 'sem_pgr';

export function statusFromVencimento(vencimento: string | null | undefined): TerceiroStatus {
  if (!vencimento) return 'sem_pgr';
  const v = new Date(vencimento).getTime();
  const now = Date.now();
  const diffDays = Math.floor((v - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'vencido';
  if (diffDays <= 30) return 'vencendo';
  return 'ok';
}
