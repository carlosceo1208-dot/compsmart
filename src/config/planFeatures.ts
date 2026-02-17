export interface PlanFeature {
  text: string;
  tooltip?: string;
  isNew?: boolean;
}

export const planFeatures: Record<string, PlanFeature[]> = {
  "Starter": [
    { text: "Até 50 colaboradores" },
    { text: "IA Jurídico Smart", tooltip: "Assistente jurídico inteligente", isNew: true },
    { text: "Comparação Salarial Avançada", tooltip: "Benchmark completo de mercado", isNew: true },
    { text: "Descrição e Avaliação de Cargos", tooltip: "Sistema de pontos", isNew: true },
    { text: "Conversão de Moeda", isNew: true },
    { text: "Calculadora de Encargos", isNew: true },
    { text: "Tabela Salarial" },
    { text: "Dashboards essenciais" },
    { text: "Avaliação de Desempenho integrada + PerformAI", tooltip: "Avaliação 90°, 180°, PDI, Matriz 9Box. PerformAI: agente IA para feedbacks, PDIs e devolutivas. Competências e metas customizáveis.", isNew: true },
    { text: "2 usuários administradores" },
    { text: "Suporte por email" }
  ],
  "Medium": [
    { text: "Até 200 colaboradores" },
    { text: "Tudo do Starter incluído" },
    { text: "2 IAs: Jurídico + Salary Smart", tooltip: "Dois agentes especializados", isNew: true },
    { text: "Organograma Interativo", tooltip: "Visualização hierárquica", isNew: true },
    { text: "Planejamento Orçamentário", tooltip: "Gestão de budget e headcount", isNew: true },
    { text: "Acesso do Gestor", tooltip: "Visualiza apenas sua própria área", isNew: true },
    { text: "Simulação de Políticas Salariais", isNew: true },
    { text: "Gestão de PLR e Incentivos" },
    { text: "Avaliação completa (90°, 180°, 360°, 6 modelos, PDI, 9Box, Sucessão) + PerformAI", tooltip: "6 modelos customizáveis. Competências e metas (individuais, depto., empresa) configuráveis. PerformAI: feedbacks, PDIs automáticos e análise 9Box.", isNew: true },
    { text: "Relatórios avançados" },
    { text: "5 usuários" },
    { text: "Suporte prioritário" }
  ],
  "Pro": [
    { text: "Até 500 colaboradores" },
    { text: "Tudo do Medium incluído" },
    { text: "3 IAs: Jurídico + Salary + Rem&Benef", tooltip: "Todos os agentes IA", isNew: true },
    { text: "Pesquisa Salarial Total Cash", tooltip: "Salário Fixo + Variável (Bônus, PLR, Comissões)", isNew: true },
    { text: "Pesquisa Salarial Total Compensation", tooltip: "Total Cash + Benefícios + ILP", isNew: true },
    { text: "Portal do Colaborador", tooltip: "Acesso aos próprios dados (opcional)" },
    { text: "Análise de equidade interna", tooltip: "Comparações por área, nível, faixa e gênero" },
    { text: "Avaliação avançada + Reconhecimento + 5 dimensões + PerformAI", tooltip: "5 dimensões de agilidade + PerformAI com análise preditiva, feedbacks automáticos, PDIs inteligentes e devolutivas personalizadas.", isNew: true },
    { text: "Modelagem preditiva", tooltip: "Forecast de 12-36 meses" },
    { text: "Dashboard de riscos trabalhistas" },
    { text: "Usuários ilimitados" },
    { text: "Treinamento online" }
  ],
  "Enterprise": [
    { text: "+500 colaboradores" },
    { text: "Tudo do Pro incluído" },
    { text: "Pesquisa Salarial Total Cash", tooltip: "Salário Fixo + Variável (Bônus, PLR, Comissões)", isNew: true },
    { text: "Pesquisa Salarial Total Compensation", tooltip: "Total Cash + Benefícios + ILP", isNew: true },
    { text: "Consultoria dedicada" },
    { text: "Integrações customizadas" },
    { text: "API e webhooks" },
    { text: "SLA garantido" },
    { text: "Treinamento personalizado" },
    { text: "Gerente de conta" }
  ]
};
