/**
 * Fonte única de SEO das rotas públicas canônicas.
 * Usada por PublicLayout/SeoHead (Helmet), pelo sitemap e pelo prerender (vite.config.ts).
 * Sem imports: precisa ser carregável pelo vite.config.
 */
export const SEO_BASE_URL = "https://www.compsmart.ia.br";
export const SEO_IMAGE = `${SEO_BASE_URL}/compsmart-social.png`;

export interface SeoRoute {
  path: string;
  title: string;
  description: string;
  priority: string;
  changefreq: "weekly" | "monthly" | "yearly";
}

export const SEO_ROUTES: SeoRoute[] = [
  { path: "/", priority: "1.0", changefreq: "weekly",
    title: "CompSmart — Gestão Estratégica de Pessoas com IA para o RH",
    description: "Plataforma modular de gestão estratégica de pessoas: remuneração, NR-1, clima, seleção, PDI e sucessão, com um agente de IA em cada módulo para o seu RH." },
  { path: "/nr1", priority: "0.9", changefreq: "weekly",
    title: "NR-1 e Riscos Psicossociais: Diagnóstico COPSOQ | CompSmart",
    description: "Prepare sua empresa para a NR-1: diagnóstico de riscos psicossociais COPSOQ-III anônimo (LGPD), matriz de risco, plano de ação e laudos em um só lugar." },
  { path: "/diagnostico", priority: "0.9", changefreq: "monthly",
    title: "Diagnóstico NR-1 Grátis em 2 Minutos | CompSmart",
    description: "Faça grátis o diagnóstico NR-1 em 2 minutos: riscos psicossociais pelo método COPSOQ-III, anônimo e em conformidade com a LGPD, com resultado imediato." },
  { path: "/maturidade", priority: "0.8", changefreq: "monthly",
    title: "Diagnóstico de Maturidade do RH Grátis | CompSmart",
    description: "Descubra em 2 minutos em qual nível de maturidade seu RH opera: estratégia, people analytics, IA, experiência do colaborador e gestão da mudança." },
  { path: "/vagas", priority: "0.7", changefreq: "weekly",
    title: "Vagas Abertas: Trabalhe nas Empresas Parceiras | CompSmart",
    description: "Veja as vagas abertas publicadas pelas empresas que usam a CompSmart e candidate-se online em poucos minutos, com seus dados protegidos conforme a LGPD." },
  { path: "/sobre-nos", priority: "0.7", changefreq: "monthly",
    title: "Sobre a CompSmart: Gestão Estratégica de Pessoas com IA",
    description: "Josué Cruz, Fernando Curral e Carlos Eduardo: décadas de experiência em RH unidas na CompSmart, parceira tecnológica de gestão estratégica de pessoas." },
  { path: "/materiais", priority: "0.7", changefreq: "monthly",
    title: "Materiais e E-books Gratuitos de RH e NR-1 | CompSmart",
    description: "Materiais gratuitos sobre remuneração estratégica, NR-1 e riscos psicossociais, clima organizacional e 9-Box para times de RH e lideranças das empresas." },
  { path: "/precos", priority: "0.8", changefreq: "monthly",
    title: "Preços por Módulo e por Colaborador | CompSmart RH com IA",
    description: "Confira os preços públicos da CompSmart por colaborador e por módulo, as faixas de porte da empresa e simule o investimento em gestão estratégica de pessoas." },
  { path: "/parceiros", priority: "0.6", changefreq: "monthly",
    title: "Parceiros e Consultores de RH com Indicação | CompSmart",
    description: "Seja parceiro CompSmart: indique e ganhe 10% recorrente enquanto a assinatura estiver ativa, ou atue como consultor sênior de RH usando a nossa plataforma." },
  { path: "/contato", priority: "0.7", changefreq: "yearly",
    title: "Contato e Demonstração da Plataforma de RH | CompSmart",
    description: "Fale com o time da CompSmart: tire dúvidas sobre módulos, preços e implantação, ou agende uma demonstração da plataforma de gestão estratégica de pessoas." },
  { path: "/plano-de-cargos-e-salarios", priority: "0.8", changefreq: "monthly",
    title: "Plano de Cargos e Salários com IA para Empresas | CompSmart",
    description: "Estruture cargos, níveis, faixas salariais e equidade interna com o módulo Core da CompSmart, e combine outros módulos conforme a necessidade da empresa." },
  { path: "/modulos/core", priority: "0.8", changefreq: "monthly",
    title: "Remuneração Estratégica e Gestão de Desempenho | CompSmart",
    description: "Módulo Core: cargos, níveis, faixas e curvas salariais integrados à avaliação de desempenho, com agente de IA que apoia o RH nas decisões de remuneração." },
  { path: "/modulos/insight", priority: "0.8", changefreq: "monthly",
    title: "Benchmark Salarial e Pesquisa de Mercado com IA | CompSmart",
    description: "Módulo Insight: benchmark de mercado, compa-ratio e análise de defasagem salarial com IA preditiva para manter a remuneração competitiva e sustentável." },
  { path: "/modulos/match", priority: "0.8", changefreq: "monthly",
    title: "Descrição de Cargos CBO e Job Matching com IA | CompSmart",
    description: "Módulo Match: descrições de cargos alinhadas à CBO e job matching com IA para enquadrar cargos com consistência, apoiando o RH na estruturação de funções." },
  { path: "/modulos/clima", priority: "0.8", changefreq: "monthly",
    title: "Pesquisa de Clima Organizacional e eNPS com IA | CompSmart",
    description: "Módulo Clima: pesquisas de clima organizacional, eNPS, engajamento e cultura com análises por agente de IA para orientar ações do RH e das lideranças." },
  { path: "/modulos/selecao-rs", priority: "0.8", changefreq: "monthly",
    title: "Recrutamento & Seleção com Faixa Salarial Certa | CompSmart",
    description: "Vagas que já nascem com faixa salarial de origem declarada, busca confidencial, perfil gerado por IA e candidaturas em conformidade com a LGPD." },
  { path: "/modulos/td-pdi", priority: "0.8", changefreq: "monthly",
    title: "Treinamento e PDI Automatizado a partir de Gaps | CompSmart",
    description: "Módulo Treinamento & PDI: trilhas de desenvolvimento e PDIs gerados a partir de gaps de competência, com acompanhamento contínuo apoiado por IA para o RH." },
  { path: "/modulos/potencial-9box", priority: "0.8", changefreq: "monthly",
    title: "Matriz 9-Box, Potencial e Plano de Sucessão | CompSmart",
    description: "Módulo Potencial & Sucessão: matriz 9-Box, identificação de pessoas-chave e planos de sucessão com IA para reter talentos e garantir a continuidade." },
  { path: "/modulos/rh-service", priority: "0.7", changefreq: "monthly",
    title: "RH Service: Consultoria de RH Apoiada por IA | CompSmart",
    description: "RH Service da CompSmart: consultores de RH atuando junto com o seu time, usando a plataforma e os agentes de IA para acelerar projetos de gestão de pessoas." },
  { path: "/glossario", priority: "0.5", changefreq: "monthly",
    title: "Glossário de RH, Remuneração e NR-1 | CompSmart Plataforma",
    description: "Glossário da CompSmart com os principais termos de RH, remuneração estratégica, NR-1, riscos psicossociais, clima organizacional e gestão de desempenho." },
  { path: "/termos-de-uso", priority: "0.3", changefreq: "yearly",
    title: "Termos de Uso da Plataforma de Gestão de Pessoas | CompSmart",
    description: "Termos e condições de uso da plataforma CompSmart: direitos, deveres, planos, cancelamento e responsabilidades das partes na contratação dos módulos." },
  { path: "/politica-de-privacidade", priority: "0.3", changefreq: "yearly",
    title: "Política de Privacidade e LGPD da Plataforma | CompSmart",
    description: "Como a CompSmart coleta, usa e protege seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018), com direitos do titular e contato do DPO." },
];

export const getSeoRoute = (path: string) => SEO_ROUTES.find((r) => r.path === path);
