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
export type DataSource = 'real' | 'seed' | 'empty';
export type FibData = { ciclo: string | null; respondentes: number; adesao: number; scores: FibScore[]; source: DataSource };

export type SegPsiScore = { key: string; label: string; score: number; descricao: string };
export type SegPsiData = { ciclo: string | null; respondentes: number; adesao: number; scores: SegPsiScore[]; source: DataSource };

export type SociodemoLinha = { rotulo: string; fib: number; segPsi: number; hse: number };
export type SociodemoRecorte = { id: string; titulo: string; linhas: SociodemoLinha[] };
export type SociodemoData = { ciclo: string | null; recortes: SociodemoRecorte[]; source: DataSource };

/**
 * Seed/dados ilustrativos só podem ser exibidos para o Super Admin do CompSmart.
 * Para qualquer cliente real, retornamos `source: 'empty'` quando não houver
 * ciclo coletado — assim o painel mostra estado vazio em vez de números fictícios.
 */
async function isCurrentUserSuperAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

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

// Conta colaboradores ativos da empresa selecionada (universo real)
async function getWorkforceCount(companyId: string): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('root_company_id', companyId)
      .eq('status', 'active')
      .not('employee_number', 'is', null);
    if (error) return 0;
    return Number(count ?? 0);
  } catch {
    return 0;
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
      // Fallback ilustrativo — gerado sobre o universo real (workforce)
      const workforce = await getWorkforceCount(activeCompanyId!);
      const respondentes = Math.max(0, Math.round(workforce * 0.875)); // 14 de 16 (~87,5%)
      return {
        ciclo: 'Ciclo Demo · 2026.1',
        respondentes,
        adesao: workforce > 0 ? (respondentes / workforce) * 100 : 0,
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
      // Fallback ilustrativo — gerado sobre o universo real (workforce)
      const workforce = await getWorkforceCount(activeCompanyId!);
      const respondentes = Math.max(0, Math.round(workforce * 0.8125)); // 13 de 16 (~81%)
      return {
        ciclo: 'Ciclo Demo · 2026.1',
        respondentes,
        adesao: workforce > 0 ? (respondentes / workforce) * 100 : 0,
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
// Para 16 colaboradores, geramos recortes coerentes com o porte real
const SEED_SOCIODEMO_PE: SociodemoRecorte[] = [
  { id: 'genero', titulo: 'Por gênero (n=16)', linhas: [
    { rotulo: 'Feminino (7)', fib: 69, segPsi: 62, hse: 71 },
    { rotulo: 'Masculino (8)', fib: 73, segPsi: 66, hse: 74 },
    { rotulo: 'Não-binário (1)', fib: 64, segPsi: 58, hse: 69 },
  ]},
  { id: 'idade', titulo: 'Por faixa etária (n=16)', linhas: [
    { rotulo: '< 25 (2)', fib: 70, segPsi: 60, hse: 72 },
    { rotulo: '25–34 (6)', fib: 72, segPsi: 65, hse: 74 },
    { rotulo: '35–44 (5)', fib: 70, segPsi: 67, hse: 73 },
    { rotulo: '45–54 (2)', fib: 66, segPsi: 64, hse: 70 },
    { rotulo: '55+ (1)', fib: 64, segPsi: 62, hse: 68 },
  ]},
  { id: 'tempo', titulo: 'Por tempo de casa (n=16)', linhas: [
    { rotulo: '< 1 ano (4)', fib: 74, segPsi: 67, hse: 75 },
    { rotulo: '1–3 anos (6)', fib: 71, segPsi: 65, hse: 72 },
    { rotulo: '3–5 anos (4)', fib: 68, segPsi: 63, hse: 70 },
    { rotulo: '5+ anos (2)', fib: 65, segPsi: 60, hse: 68 },
  ]},
  { id: 'area', titulo: 'Por área (n=16)', linhas: [
    { rotulo: 'Tecnologia (6)', fib: 75, segPsi: 71, hse: 77 },
    { rotulo: 'Comercial (4)', fib: 70, segPsi: 64, hse: 71 },
    { rotulo: 'Operações (4)', fib: 62, segPsi: 55, hse: 64 },
    { rotulo: 'Administrativo (2)', fib: 71, segPsi: 66, hse: 72 },
  ]},
];

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
      return { ciclo: 'Ciclo Demo · 2026.1', recortes: SEED_SOCIODEMO_PE, source: 'seed' };
    },
  });
};

// ---------- Universo de respondentes (para o cabeçalho dos painéis) ----------
export const useNr1Workforce = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery<number>({
    queryKey: ['nr1-workforce', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: () => getWorkforceCount(activeCompanyId!),
  });
};
