export interface PlanFeature {
  text: string;
  tooltip?: string;
  isNew?: boolean;
}

export const planFeatures: Record<string, PlanFeature[]> = {
  "Starter": [
    { text: "Até 50 funcionários" },
    { text: "Estrutura básica de cargos" },
    { text: "Pesquisa Salarial", tooltip: "Compare salários com dados reais de mercado" },
    { text: "Dashboards essenciais" },
    { text: "Suporte por email" },
    { text: "2 usuários administradores" }
  ],
  "Medium": [
    { text: "Até 200 funcionários" },
    { text: "Agentes Inteligentes IA", tooltip: "3 agentes especializados: Jurídico, Análise Salarial e R&B", isNew: true },
    { text: "Pesquisa Salarial", tooltip: "Compare salários com dados reais de mercado", isNew: true },
    { text: "Gestão de PLR e incentivos" },
    { text: "Compliance automático" },
    { text: "Relatórios avançados" },
    { text: "5 usuários" },
    { text: "Suporte prioritário" }
  ],
  "Pro": [
    { text: "Até 500 funcionários" },
    { text: "Tudo do Medium incluído" },
    { text: "Análise de equidade interna", tooltip: "Comparações por área, nível, faixa e gênero" },
    { text: "Simulações de política salarial", tooltip: "Ajuste automático de tabelas salariais", isNew: true },
    { text: "Modelagem preditiva", tooltip: "Forecast de 12-36 meses", isNew: true },
    { text: "Dashboard de riscos trabalhistas" },
    { text: "Usuários ilimitados" },
    { text: "Treinamento online" }
  ],
  "Enterprise": [
    { text: "+500 funcionários" },
    { text: "Tudo do Pro incluído" },
    { text: "Consultoria dedicada" },
    { text: "Integrações customizadas" },
    { text: "API e webhooks" },
    { text: "SLA garantido" },
    { text: "Treinamento personalizado" },
    { text: "Gerente de conta" }
  ]
};
