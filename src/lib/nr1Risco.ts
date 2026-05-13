// Grau de Risco INSS / NR-1
// Classificação por CNAE (FAP/RAT) — define exigências mínimas de NR-1

export type GrauRiscoInss = 1 | 2 | 3 | 4;

export interface GrauRiscoInfo {
  grau: GrauRiscoInss;
  label: string;
  rat: string; // alíquota RAT
  exemplos: string;
  exigencias: string[];
  acoesObrigatorias: string[];
  cor: string; // tailwind text color
  bg: string; // tailwind bg color
}

export const GRAU_RISCO_INSS: Record<GrauRiscoInss, GrauRiscoInfo> = {
  1: {
    grau: 1,
    label: 'Risco Leve',
    rat: '1% RAT',
    exemplos: 'Escritórios, comércio varejista, serviços administrativos, TI.',
    exigencias: [
      'Inventário de riscos psicossociais simplificado',
      'PGR atualizado anualmente',
      'Treinamento básico de saúde mental para gestores',
    ],
    acoesObrigatorias: [
      'Mapeamento anual de riscos psicossociais',
      'Canal de escuta ativa para colaboradores',
      'Comunicação interna sobre saúde mental',
    ],
    cor: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  },
  2: {
    grau: 2,
    label: 'Risco Médio',
    rat: '2% RAT',
    exemplos: 'Indústria leve, transporte de passageiros, hotelaria, hospitais.',
    exigencias: [
      'PGR com plano de ação documentado',
      'Avaliação periódica (mínimo a cada 12 meses)',
      'Treinamento de líderes em gestão de riscos psicossociais',
    ],
    acoesObrigatorias: [
      'Diagnóstico psicossocial com instrumento validado',
      'Plano de ação com responsáveis e prazos',
      'Indicadores de saúde mental no painel da diretoria',
    ],
    cor: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  },
  3: {
    grau: 3,
    label: 'Risco Grave',
    rat: '3% RAT',
    exemplos: 'Construção civil, indústria química, transporte de carga, segurança.',
    exigencias: [
      'PGR detalhado com revisão semestral',
      'Comissão interna de saúde mental (CISM/SESMT)',
      'Auditoria externa de conformidade NR-1',
      'Programa contínuo de capacitação de líderes',
    ],
    acoesObrigatorias: [
      'Diagnóstico psicossocial semestral',
      'Plano de ação com KPIs e governança formal',
      'Atendimento psicológico disponível aos colaboradores',
      'Relatórios trimestrais à alta liderança',
    ],
    cor: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800',
  },
  4: {
    grau: 4,
    label: 'Risco Gravíssimo',
    rat: '3% RAT (máx)',
    exemplos: 'Mineração, siderurgia pesada, petroquímica, energia.',
    exigencias: [
      'PGR robusto com revisão trimestral',
      'SESMT completo + comitê de crise',
      'Programa estruturado de saúde mental e segurança psicológica',
      'Auditoria externa anual obrigatória',
      'Reporte regulatório ao MTE',
    ],
    acoesObrigatorias: [
      'Diagnóstico psicossocial trimestral',
      'Plano de ação com governança e auditoria',
      'Equipe multidisciplinar (psicólogo, médico do trabalho, RH)',
      'Protocolos de crise e suporte 24/7',
      'Indicadores reportados ao Conselho',
    ],
    cor: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800',
  },
};

export const ACAO_STATUS_LABEL = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  atrasado: 'Atrasado',
} as const;

export const ACAO_PRIORIDADE_LABEL = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
} as const;

export const ACAO_STATUS_CLASS = {
  pendente: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  em_andamento: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  concluido: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  atrasado: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
} as const;

export const ACAO_PRIORIDADE_CLASS = {
  baixa: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  media: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  alta: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  critica: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
} as const;
