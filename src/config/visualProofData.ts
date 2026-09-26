/**
 * Dados ILUSTRATIVOS da seção "Resultado não se explica — se mostra" (Home).
 * Não são resultados de clientes. Trocar por dados reais aqui, sem mexer no layout.
 */

/** Nível de risco 0 (baixo) a 3 (alto). */
export const NR1_DATA = {
  dimensoes: ["Exigências", "Controle", "Apoio Social", "Relacionamentos", "Recompensas", "Segurança"],
  grupos: ["Comercial", "Operações", "TI", "Financeiro", "RH"],
  matriz: [
    [2, 1, 0, 1, 1, 0],
    [3, 2, 1, 1, 2, 1],
    [1, 0, 0, 0, 1, 0],
    [1, 1, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  riscoGlobal: "Baixo",
  dimensoesCriticas: 1,
  evolucao: "Risco Alto → Baixo",
  tendencia: [82, 74, 66, 55, 46, 38, 31],
  meses: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"],
};

export const CLIMA_DATA = {
  enps: 62,
  variacao: "+18 pts",
  participacao: "91%",
  engajamento: "78%",
  areas: [
    { nome: "Vendas", valor: 68 },
    { nome: "Operações", valor: 54 },
    { nome: "TI", valor: 71 },
    { nome: "Financeiro", valor: 59 },
    { nome: "RH", valor: 64 },
  ],
  trimestres: [
    { t: "T1", v: 44 },
    { t: "T2", v: 51 },
    { t: "T3", v: 57 },
    { t: "T4", v: 62 },
  ],
};

export const RS_DATA = {
  funil: [
    { etapa: "Triagem", qtd: 240 },
    { etapa: "Entrevista RH", qtd: 96 },
    { etapa: "Entrevista Gestor", qtd: 58 },
    { etapa: "Proposta", qtd: 51 },
    { etapa: "Contratado", qtd: 43 },
  ],
  tempoMedio: "21 dias",
  variacaoTempo: "-40%",
  vagasAtivas: 12,
  conversao: "18%",
  tempoHistorico: [35, 32, 29, 26, 23, 21],
  vagas: ["Analista Financeiro", "Dev Front-end", "Coord. Operações"],
};

export type StatusMercado = "Acima" | "Alinhado" | "Abaixo";

export const REMU_DATA = {
  compaRatio: "94%",
  abaixoMercado: 3,
  /** Curvas de mercado por nível (1-6), em R$ mil. */
  p25: [3.2, 4.6, 6.4, 8.8, 12.0, 16.5],
  p50: [3.8, 5.4, 7.5, 10.3, 14.1, 19.4],
  p75: [4.5, 6.4, 8.9, 12.2, 16.7, 23.0],
  empresa: [3.9, 5.0, 7.6, 9.1, 13.0, 20.1],
  cargos: [
    { nome: "Diretor", status: "Acima" as StatusMercado },
    { nome: "Coordenador", status: "Alinhado" as StatusMercado },
    { nome: "Especialista", status: "Abaixo" as StatusMercado },
    { nome: "Analista Pl.", status: "Abaixo" as StatusMercado },
    { nome: "Assistente", status: "Alinhado" as StatusMercado },
  ],
};
