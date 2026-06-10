// NR-1 pricing tiers — R$ 5,00 por colaborador, com tetos por faixa
export interface Nr1Tier {
  id: string;
  name: string;
  rangeLabel: string;
  minColab: number;
  maxColab: number | null; // null = ilimitado / sob consulta
  monthlyPrice: number | null; // null = sob consulta
  perColabLabel: string;
  popular?: boolean;
  custom?: boolean;
  features: string[];
}

export const NR1_TIERS: Nr1Tier[] = [
  {
    id: 'essencial',
    name: 'Essencial',
    rangeLabel: 'até 50 colaboradores',
    minColab: 1,
    maxColab: 50,
    monthlyPrice: 250,
    perColabLabel: 'R$ 5,00/colaborador',
    features: [
      'Diagnóstico COPSOQ-III completo',
      'Relatório PDF para fiscalização',
      'Dashboard de risco psicossocial',
      'Respondentes ilimitados',
    ],
  },
  {
    id: 'crescimento',
    name: 'Crescimento',
    rangeLabel: '51 a 200 colaboradores',
    minColab: 51,
    maxColab: 200,
    monthlyPrice: 1000,
    perColabLabel: 'a partir de R$ 5,00/colaborador',
    popular: true,
    features: [
      'Tudo do Essencial',
      'Plano de ação Kanban + evidências',
      'Pesquisa de Clima integrada',
      'Alertas inteligentes',
    ],
  },
  {
    id: 'consolidacao',
    name: 'Consolidação',
    rangeLabel: '201 a 500 colaboradores',
    minColab: 201,
    maxColab: 500,
    monthlyPrice: 2500,
    perColabLabel: 'a partir de R$ 5,00/colaborador',
    features: [
      'Tudo do Crescimento',
      'Cruzamento NR-1 × 9Box × Remuneração',
      'Correlação COPSOQ × Clima',
      'Gestão de terceiros (PGR)',
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    rangeLabel: '501 a 750 colaboradores',
    minColab: 501,
    maxColab: 750,
    monthlyPrice: 3750,
    perColabLabel: 'a partir de R$ 5,00/colaborador',
    features: [
      'Tudo da Consolidação',
      'Multi-unidades / multi-CNPJs',
      'Relatórios executivos C-Level',
      'Suporte prioritário',
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate',
    rangeLabel: '751 a 1.000 colaboradores',
    minColab: 751,
    maxColab: 1000,
    monthlyPrice: 5000,
    perColabLabel: 'a partir de R$ 5,00/colaborador',
    features: [
      'Tudo do Performance',
      'API & webhooks',
      'SSO corporativo',
      'Gerente de conta dedicado',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    rangeLabel: 'acima de 1.000 colaboradores',
    minColab: 1001,
    maxColab: null,
    monthlyPrice: null,
    perColabLabel: 'Proposta sob medida',
    custom: true,
    features: [
      'Volume ilimitado',
      'Integrações customizadas',
      'SLA garantido',
      'Consultoria dedicada',
    ],
  },
];

export const formatBRL0 = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
