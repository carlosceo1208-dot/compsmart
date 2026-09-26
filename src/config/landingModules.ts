import {
  Layers,
  LineChart,
  Target,
  ShieldCheck,
  HeartHandshake,
  UserSearch,
  GraduationCap,
  Grid3X3,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface LandingModule {
  slug: string;
  route: string;
  nome: string;
  nomeCurto: string;
  agente: string;
  selo: string;
  icon: LucideIcon;
  resumo: string;
  /** Chamada de resultado usada nos cards da Home. */
  chamada?: string;
  /** Hero da subpágina */
  problema: string;
  solucao: string;
  recursos: string[];
  /** Cruzamento com os demais módulos */
  cruzamentos: string[];
  negociavel?: boolean;
  legal?: boolean;
}

export const LANDING_MODULES: LandingModule[] = [
  {
    slug: "core",
    chamada: "Faixas no percentil competitivo para atrair e reter sem estourar a folha.",
    route: "/modulos/core",
    nome: "Gestão Estratégica de Remuneração e Desempenho",
    nomeCurto: "Core",
    agente: "Remu",
    selo: "Core",
    icon: Layers,
    resumo:
      "Cargos, níveis, faixas e curvas salariais integrados à avaliação de desempenho.",
    problema:
      "Salários definidos caso a caso, planilhas paralelas e nenhuma régua clara de mérito.",
    solucao:
      "Uma estrutura única de cargos, níveis e faixas salariais, conectada à avaliação de desempenho, para decidir mérito e promoção com critério.",
    recursos: [
      "Plano de cargos com avaliação por pontos e código CBO",
      "Tabelas e faixas salariais com curvas e amplitude configuráveis",
      "Avaliação de desempenho, metas em cascata, PDI e reconhecimento",
      "Orçamento de mérito, governança e simulação de dissídio",
      "Importação da base da folha em Excel/CSV com mapeamento inteligente",
    ],
    cruzamentos: [
      "Insight: compara suas faixas com o mercado",
      "Potencial & 9-Box: liga desempenho e potencial às decisões de mérito",
      "NR-1: mostra onde o risco psicossocial encontra distorção salarial",
    ],
  },
  {
    slug: "insight",
    route: "/modulos/insight",
    nome: "Insight de Mercado",
    nomeCurto: "Insight",
    agente: "Insight",
    selo: "Market",
    icon: LineChart,
    resumo:
      "Benchmark de mercado, compa-ratio, defasagem e tendências citadas com fonte.",
    problema:
      "Você não sabe se está pagando acima ou abaixo do mercado — e descobre tarde, quando o talento pede demissão.",
    solucao:
      "Benchmark estruturado com compa-ratio, defasagem por cargo e área, além de tendências públicas de mercado sempre com fonte e data.",
    recursos: [
      "Importação e gestão de pesquisas salariais",
      "Compa-ratio, posicionamento competitivo e defasagem por cargo",
      "Alertas de competitividade e mismatch de remuneração",
      "Tendências de mercado e legislação com fonte citada",
    ],
    cruzamentos: [
      "Core: aplica o benchmark direto nas faixas salariais",
      "Match: compara cargos equivalentes com metodologia consistente",
      "Potencial & 9-Box: prioriza correção onde há alto potencial defasado",
    ],
  },
  {
    slug: "match",
    route: "/modulos/match",
    nome: "Job Match",
    nomeCurto: "Match",
    agente: "Match",
    selo: "Job Fit",
    icon: Target,
    resumo:
      "Descrição de cargos com CBO e job matching por conteúdo, não por título.",
    problema:
      "Cargos com nomes diferentes e conteúdos iguais tornam qualquer comparação de mercado frágil.",
    solucao:
      "Descrição estruturada de cargos e job matching por conteúdo de trabalho, para comparar o que realmente é comparável.",
    recursos: [
      "Descrições de cargo geradas com apoio de IA e código CBO",
      "Job matching por conteúdo, escopo e responsabilidade",
      "Histórico de correspondências e justificativa de cada match",
      "Base de competências por cargo",
    ],
    cruzamentos: [
      "Insight: benchmark confiável porque o cargo foi bem correspondido",
      "Core: alimenta a estrutura de cargos e níveis",
      "T&D/PDI: gaps de competência viram trilha de desenvolvimento",
    ],
  },
  {
    slug: "nr1",
    chamada: "Adequação à Portaria MTE 1.419 com mapa de risco pronto em dias — não meses.",
    route: "/nr1",
    nome: "Saúde Mental & Bem-Estar (NR-1)",
    nomeCurto: "NR-1",
    agente: "Psi",
    selo: "LEGAL OBRIGATÓRIO",
    icon: ShieldCheck,
    legal: true,
    resumo:
      "Riscos psicossociais com COPSOQ-III, matriz de risco, plano de ação e laudos.",
    problema:
      "A NR-1 exige o gerenciamento dos riscos psicossociais, com prazo e fiscalização — e a maioria das empresas não tem ferramenta para isso.",
    solucao:
      "O núcleo legal completo: diagnóstico COPSOQ-III anônimo, matriz de risco, plano de ação e documentação pronta para auditoria.",
    recursos: [
      "Diagnóstico COPSOQ-III com 40 questões anônimas e conformidade LGPD",
      "Matriz de risco por dimensão, área e grupo (nunca por pessoa)",
      "Plano de ação em kanban com responsáveis, prazos e histórico",
      "Gestão de terceiros e integração ao PGR",
      "Laudos e relatórios para fiscalização",
    ],
    cruzamentos: [
      "Clima, Potencial & 9-Box e Remuneração são complementos modulares, ativáveis à parte",
      "Nenhum cruzamento é exigido para cumprir a NR-1",
    ],
  },
  {
    slug: "clima",
    chamada: "eNPS medido, analisado e com plano de ação em andamento antes de perder talento.",
    route: "/modulos/clima",
    nome: "Clima Organizacional",
    nomeCurto: "Clima",
    agente: "Clima",
    selo: "Cultura & eNPS",
    icon: HeartHandshake,
    resumo: "Pesquisa de clima, eNPS, engajamento e leitura de cultura.",
    problema:
      "Pesquisas de clima que viram PDF, não geram ação e não explicam a rotatividade.",
    solucao:
      "Pesquisa de clima com eNPS e engajamento por área, com leitura acionável e comparação ao longo do tempo.",
    recursos: [
      "Pesquisas de clima com modalidades isolada ou integrada",
      "eNPS, engajamento e recortes por área e liderança",
      "Feedback de clientes internos e externos",
      "Acompanhamento de evolução entre ciclos",
    ],
    cruzamentos: [
      "NR-1: clima explica parte do risco psicossocial (módulo à parte)",
      "Potencial & 9-Box: risco de perda de talento por ambiente",
      "Core: liga percepção de justiça à política salarial",
    ],
  },
  {
    slug: "talent",
    chamada: "Feche a vaga certa na primeira vez, com match por perfil — dados, não intuição.",
    route: "/modulos/selecao-rs",
    nome: "Recrutamento & Seleção (Aquisição de Talentos)",
    nomeCurto: "Recrutamento & Seleção",
    agente: "Talent",
    selo: "AQUISIÇÃO DE TALENTOS",
    icon: UserSearch,
    resumo: "Vagas, candidatos, triagem e match de perfil com o cargo real.",
    problema:
      "Vagas abertas por muito tempo, triagem manual e contratação que não combina com a estrutura de cargos.",
    solucao:
      "Gestão de vagas e candidatos com triagem apoiada por IA e match contra a descrição real do cargo.",
    recursos: [
      "Cadastro de vagas ligado ao plano de cargos",
      "Triagem e ranqueamento de candidatos",
      "Match de perfil contra requisitos e competências",
      "Acompanhamento do funil de contratação",
    ],
    cruzamentos: [
      "Match: usa a descrição de cargo como referência da vaga",
      "Insight: propõe faixa de oferta compatível com o mercado",
      "T&D/PDI: plano de integração a partir dos gaps do contratado",
    ],
  },
  {
    slug: "evolve",
    route: "/modulos/td-pdi",
    nome: "Treinamento & PDI",
    nomeCurto: "T&D/PDI",
    agente: "Evolve",
    selo: "TREINAMENTO & PDI",
    icon: GraduationCap,
    resumo: "Trilhas e PDIs gerados a partir dos gaps reais de competência.",
    problema:
      "Treinamento comprado por catálogo, sem relação com o gap real de cada colaborador.",
    solucao:
      "Trilhas e PDIs sugeridos a partir dos gaps de competência e da avaliação de desempenho, com acompanhamento.",
    recursos: [
      "PDI gerado a partir de gaps de competência e avaliação",
      "Trilhas por cargo, área e nível",
      "Acompanhamento de progresso e evidências",
      "Ligação com sucessão e prontidão",
    ],
    cruzamentos: [
      "Core: desempenho aponta o que desenvolver",
      "Potencial & 9-Box: desenvolvimento como caminho de sucessão",
      "Match: gaps de competência vindos da descrição de cargo",
    ],
  },
  {
    slug: "potencial-sucessao",
    chamada: "Saiba quem são seus key people antes do mercado levar.",
    route: "/modulos/potencial-9box",
    nome: "Avaliação de Potencial e Sucessão",
    nomeCurto: "Potencial & 9-Box",
    agente: "Potencial",
    selo: "MATRIZ 9-BOX & SUCESSÃO",
    icon: Grid3X3,
    resumo: "Matriz 9-Box, pessoas-chave, prontidão e plano de sucessão.",
    problema:
      "Ninguém sabe quem substitui quem, e a saída de uma pessoa-chave para o processo.",
    solucao:
      "Matriz 9-Box com dimensões de potencial, mapa de pessoas-chave e plano de sucessão com prontidão.",
    recursos: [
      "Matriz 9-Box com posicionamento calculado",
      "Dimensões de potencial configuráveis",
      "Plano de sucessão com prontidão e risco de retenção",
      "Cenários de decisão e recomendações de talento",
    ],
    cruzamentos: [
      "Core: prioriza mérito e retenção onde o risco é maior",
      "Clima e NR-1: ambiente e risco psicossocial no risco de perda",
      "T&D/PDI: desenvolvimento para fechar a lacuna de sucessão",
    ],
  },
  {
    slug: "rh-service",
    route: "/modulos/rh-service",
    nome: "RH Service",
    nomeCurto: "RH Service",
    agente: "Consultores Seniores",
    selo: "CONSULTORIA SÊNIOR",
    icon: Briefcase,
    negociavel: true,
    resumo:
      "Consultores seniores por demanda, com diagnóstico de maturidade de RH.",
    problema:
      "Time de RH enxuto, demanda estratégica crescente e nenhuma estrutura para contratar sênior em tempo integral.",
    solucao:
      "Consultores seniores por demanda, remunerados por projeto ou por horas, com diagnóstico de maturidade que mostra por onde começar.",
    recursos: [
      "Diagnóstico de maturidade de RH com score e nível por prática",
      "Recomendação de módulos a partir do diagnóstico",
      "Projeto de consultoria sob medida",
      "Apoio contínuo ao time de RH, por horas",
    ],
    cruzamentos: [
      "O diagnóstico aponta quais módulos resolvem cada lacuna",
      "O consultor trabalha dentro da plataforma, junto com o seu RH",
    ],
  },
];

export const CONTACT_EMAIL = "contato@compsmart.ia.br";
