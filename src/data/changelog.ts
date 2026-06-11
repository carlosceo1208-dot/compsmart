import { Rocket, Brain, BarChart3, Shield, Gift, Calculator, FileText, Bell } from "lucide-react";

export type ChangelogCategory = 'lancamento' | 'novo' | 'melhoria' | 'correcao';

export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  category: ChangelogCategory;
  icon: React.ElementType;
  details?: string[];
}

export const changelogEntries: ChangelogEntry[] = [
  {
    date: '2026-01-07',
    title: 'Lançamento Oficial CompSmart',
    description: 'Plataforma completa de gestão de remuneração estratégica com inteligência artificial integrada.',
    category: 'lancamento',
    icon: Rocket,
    details: [
      'Módulo Core para gestão interna de salários e cargos',
      'Módulo Insight para inteligência salarial e benchmark',
      'Módulo Match para descrição e correspondência de cargos',
      'Dashboard executivo com KPIs em tempo real'
    ]
  },
  {
    date: '2026-01-07',
    title: 'Assistentes de IA Integrados',
    description: 'Chatbots especializados para análise salarial, benefícios, incentivos e legislação trabalhista.',
    category: 'novo',
    icon: Brain,
    details: [
      'Assistente de Salários com análise de competitividade',
      'Assistente Jurídico para legislação trabalhista CLT',
      'Assistente de Incentivos para ICP e ILP',
      'Suporte via chat com IA para dúvidas gerais'
    ]
  },
  {
    date: '2026-01-07',
    title: 'Dashboard de People Analytics',
    description: 'Visualização completa de métricas de remuneração, competitividade e tendências salariais.',
    category: 'novo',
    icon: BarChart3,
    details: [
      'Gráficos de distribuição salarial por grade',
      'Comparativo empresa vs mercado',
      'Análise de desvio de faixas salariais',
      'Tendências de remuneração por área'
    ]
  },
  {
    date: '2026-01-07',
    title: 'Segurança LGPD Compliant',
    description: 'Criptografia ponta-a-ponta, controle de acesso granular e auditoria completa de operações.',
    category: 'novo',
    icon: Shield,
    details: [
      'Autenticação multi-fator (MFA)',
      'Logs de auditoria completos',
      'Controle de acesso por perfil (RBAC)',
      'Criptografia de dados sensíveis'
    ]
  },
  {
    date: '2026-01-07',
    title: 'Gestão de Benefícios',
    description: 'Cadastro completo de benefícios com elegibilidade por grade e análise de custos.',
    category: 'novo',
    icon: Gift,
    details: [
      'Cadastro de benefícios por tipo',
      'Regras de elegibilidade automáticas',
      'Dashboard de custos por unidade',
      'Atribuição em lote de benefícios'
    ]
  },
  {
    date: '2026-01-07',
    title: 'Programas de Incentivos ICP/ILP',
    description: 'Gestão completa de incentivos de curto e longo prazo com vesting e cliff.',
    category: 'novo',
    icon: Calculator,
    details: [
      'Stock Options e RSU',
      'Phantom Shares',
      'Previdência corporativa com matching',
      'Bônus diferido'
    ]
  },
  {
    date: '2026-01-07',
    title: 'Orçamento de Pessoal',
    description: 'Planejamento orçamentário completo com projeções, aprovações e alertas.',
    category: 'novo',
    icon: FileText,
    details: [
      'Projeções mensais por unidade',
      'Fluxo de aprovação configurável',
      'Alertas de desvio orçamentário',
      'Simulação de contratações'
    ]
  },
  {
    date: '2026-01-07',
    title: 'Sistema de Alertas Inteligentes',
    description: 'Notificações automáticas para eventos críticos de remuneração e compliance.',
    category: 'novo',
    icon: Bell,
    details: [
      'Alertas de defasagem salarial',
      'Notificações de vencimento de trial',
      'Alertas de segurança',
      'Lembretes de orçamento'
    ]
  }
];

export const categoryStyles: Record<ChangelogCategory, string> = {
  lancamento: 'bg-gradient-to-r from-primary to-secondary text-white',
  novo: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  melhoria: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  correcao: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
};

export const categoryLabels: Record<ChangelogCategory, string> = {
  lancamento: 'Lançamento',
  novo: 'Novo',
  melhoria: 'Melhoria',
  correcao: 'Correção'
};
