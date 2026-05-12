import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { FIB_DIMENSOES, ESTAGIOS_SEG_PSI } from '@/lib/fib';

/**
 * Hooks de dados executivos do módulo NR-1 (FIB, Segurança Psicológica e
 * Cruzamento Sociodemográfico).
 *
 * Estratégia: tenta carregar resultados consolidados das tabelas
 * `nr1_fib_results`, `nr1_segpsi_results` e `nr1_sociodemo_results`. Se as
 * tabelas ainda não existirem ou não houver ciclo coletado, devolve seeds
 * ilustrativos com `source: 'seed'` para a UI sinalizar ao usuário.
 *
 * Quando o backend de ciclos for implementado, basta criar as tabelas/RPCs
 * com a mesma forma de retorno — nenhum ajuste nas páginas é necessário.
 */

// ---------- Tipos ----------
export type FibScore = { key: string; label: string; grupo: 'pessoa' | 'organizacao'; colaborador: number; empresa: number };
export type FibData = { ciclo: string | null; respondentes: number; adesao: number; scores: FibScore[]; source: 'real' | 'seed' };

export type SegPsiScore = { key: string; label: string; score: number; descricao: string };
export type SegPsiData = { ciclo: string | null; respondentes: number; adesao: number; scores: SegPsiScore[]; source: 'real' | 'seed' };

export type SociodemoLinha = { rotulo: string; fib: number; segPsi: number; hse: number };
export type SociodemoRecorte = { id: string; titulo: string; linhas: SociodemoLinha[] };
export type SociodemoData = { ciclo: string | null; recortes: SociodemoRecorte[]; source: 'real' | 'seed' };

// ---------- Seeds (fallback ilustrativo) ----------
const SEED_FIB_COLAB: Record<string, number> = {
  bem_estar_psicologico: 72, saude: 68, uso_do_tempo: 61, vitalidade_comunitaria: 70,
  cultura: 74, educacao: 66, governanca: 71, meio_ambiente: 80, padrao_de_vida: 64,
};
const SEED_FIB_EMP: Record<string, number> = {
  bem_estar_psicologico: 78, saude: 82, uso_do_tempo: 70, vitalidade_comunitaria: 75,
  cultura: 80, educacao: 77, governanca: 84, meio_ambiente: 85, padrao_de_vida: 72,
};
const SEED_SEGPSI: Record<string, number> = { incluir: 71.4, aprender: 65.1, contribuir: 65.1, desafiar: 40.5 };
const SEED_SOCIODEMO: SociodemoRecorte[] = [
  { id: 'genero', titulo: 'Por gênero', linhas: [
    { rotulo: 'Feminino', fib: 68, segPsi: 62, hse: 71 },
    { rotulo: 'Masculino', fib: 72, segPsi: 65, hse: 74 },
    { rotulo: 'Não-binário', fib: 64, segPsi: 58, hse: 69 },
  ]},
  { id: 'idade', titulo: 'Por faixa etária', linhas: [
    { rotulo: '< 25 anos', fib: 70, segPsi: 60, hse: 72 },
    { rotulo: '25–34', fib: 71, segPsi: 64, hse: 73 },
    { rotulo: '35–44', fib: 69, segPsi: 67, hse: 74 },
    { rotulo: '45–54', fib: 66, segPsi: 65, hse: 70 },
    { rotulo: '55+', fib: 64, segPsi: 63, hse: 68 },
  ]},
  { id: 'tempo', titulo: 'Por tempo de casa', linhas: [
    { rotulo: '< 1 ano', fib: 73, segPsi: 66, hse: 75 },
    { rotulo: '1–3 anos', fib: 70, segPsi: 64, hse: 72 },
    { rotulo: '3–5 anos', fib: 68, segPsi: 63, hse: 70 },
    { rotulo: '5+ anos', fib: 65, segPsi: 61, hse: 68 },
  ]},
  { id: 'area', titulo: 'Por área', linhas: [
    { rotulo: 'Operações', fib: 62, segPsi: 55, hse: 64 },
    { rotulo: 'Comercial', fib: 70, segPsi: 64, hse: 71 },
    { rotulo: 'Tecnologia', fib: 74, segPsi: 70, hse: 76 },
    { rotulo: 'Administrativo', fib: 71, segPsi: 66, hse: 72 },
  ]},
];

// Tenta consultar uma tabela e retorna [] se ela não existir ainda
async function safeSelect<T = any>(table: string, companyId: string): Promise<T[] | null> {
  try {
    const { data, error } = await (supabase as any)
      .from(table)
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) return null;
    return (data ?? []) as T[];
  } catch {
    return null;
  }
}

// ---------- FIB ----------
export const useFibData = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery<FibData>({
    queryKey: ['nr1-fib-data', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const rows = await safeSelect<any>('nr1_fib_results', activeCompanyId!);
      if (rows && rows.length > 0) {
        const ultimo = rows[0];
        const scores: FibScore[] = FIB_DIMENSOES.map((d) => ({
          key: d.key,
          label: d.label,
          grupo: d.grupo,
          colaborador: Number(ultimo?.scores_colaborador?.[d.key] ?? 0),
          empresa: Number(ultimo?.scores_empresa?.[d.key] ?? 0),
        }));
        return {
          ciclo: ultimo?.ciclo_nome ?? null,
          respondentes: Number(ultimo?.respondentes ?? 0),
          adesao: Number(ultimo?.adesao_pct ?? 0),
          scores,
          source: 'real',
        };
      }
      // Fallback seed
      return {
        ciclo: null,
        respondentes: 0,
        adesao: 0,
        scores: FIB_DIMENSOES.map((d) => ({
          key: d.key,
          label: d.label,
          grupo: d.grupo,
          colaborador: SEED_FIB_COLAB[d.key],
          empresa: SEED_FIB_EMP[d.key],
        })),
        source: 'seed',
      };
    },
  });
};

// ---------- Segurança Psicológica ----------
export const useSegPsiData = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery<SegPsiData>({
    queryKey: ['nr1-segpsi-data', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const rows = await safeSelect<any>('nr1_segpsi_results', activeCompanyId!);
      if (rows && rows.length > 0) {
        const ultimo = rows[0];
        const scores: SegPsiScore[] = ESTAGIOS_SEG_PSI.map((e) => ({
          key: e.key,
          label: e.label,
          descricao: e.descricao,
          score: Number(ultimo?.scores?.[e.key] ?? 0),
        }));
        return {
          ciclo: ultimo?.ciclo_nome ?? null,
          respondentes: Number(ultimo?.respondentes ?? 0),
          adesao: Number(ultimo?.adesao_pct ?? 0),
          scores,
          source: 'real',
        };
      }
      return {
        ciclo: null,
        respondentes: 1626,
        adesao: 60.53,
        scores: ESTAGIOS_SEG_PSI.map((e) => ({
          key: e.key,
          label: e.label,
          descricao: e.descricao,
          score: SEED_SEGPSI[e.key],
        })),
        source: 'seed',
      };
    },
  });
};

// ---------- Sociodemográfico ----------
export const useSociodemoData = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery<SociodemoData>({
    queryKey: ['nr1-sociodemo-data', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const rows = await safeSelect<any>('nr1_sociodemo_results', activeCompanyId!);
      if (rows && rows.length > 0) {
        const ultimo = rows[0];
        const recortes = (ultimo?.recortes ?? []) as SociodemoRecorte[];
        if (recortes.length > 0) {
          return { ciclo: ultimo?.ciclo_nome ?? null, recortes, source: 'real' };
        }
      }
      return { ciclo: null, recortes: SEED_SOCIODEMO, source: 'seed' };
    },
  });
};
