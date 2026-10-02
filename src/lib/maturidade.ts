// Diagnóstico de Maturidade do RH — cálculos puros (teaser e scorecard usam as MESMAS funções).

export const NIVEIS = [
  { key: "Reativo", n: 1, frase: "RH apagando incêndio, sem dados, sem voz no negócio." },
  { key: "Estruturado", n: 2, frase: "Processos definidos, mas RH isolado do negócio." },
  { key: "Alinhado", n: 3, frase: "RH usa dados e IA para apoiar decisões com as áreas." },
  { key: "Parceiro", n: 4, frase: "RH senta à mesa com a liderança e influencia com métricas." },
  { key: "Transformacional", n: 5, frase: "RH antecipa cenários, lidera a transformação e gera vantagem competitiva com talento." },
] as const;
export type NivelKey = (typeof NIVEIS)[number]["key"];

/** Rótulos públicos do modelo 5×2. Os códigos internos acima permanecem estáveis. */
export const NIVEIS_ESTRUTURAIS = [
  { n: 1, nome: "Reativo", codigo: "Reativo" },
  { n: 2, nome: "Operacional", codigo: "Estruturado" },
  { n: 3, nome: "Tático", codigo: "Alinhado" },
  { n: 4, nome: "Estratégico", codigo: "Parceiro" },
  { n: 5, nome: "Transformador", codigo: "Transformacional" },
] as const satisfies ReadonlyArray<{ n: number; nome: string; codigo: NivelKey }>;

export const ESTILOS_GESTAO = [
  { n: 1, nome: "Controle" },
  { n: 2, nome: "Informativo" },
  { n: 3, nome: "Participativo" },
  { n: 4, nome: "Facilitador" },
  { n: 5, nome: "Empoderamento" },
] as const;

export const rotuloNivelEstrutural = (codigo: NivelKey) =>
  NIVEIS_ESTRUTURAIS.find((nivel) => nivel.codigo === codigo)?.nome ?? "Reativo";

/** Limite superior incluso no nível de baixo: <=1.8 Reativo, <=2.6 Estruturado, <=3.4 Alinhado, <=4.2 Parceiro, >4.2 Transformacional. */
export function nivelDoScore(score: number): NivelKey {
  if (score <= 1.8) return "Reativo";
  if (score <= 2.6) return "Estruturado";
  if (score <= 3.4) return "Alinhado";
  if (score <= 4.2) return "Parceiro";
  return "Transformacional";
}
export const fraseDoNivel = (k: NivelKey) => NIVEIS.find((n) => n.key === k)!.frase;

export const EIXOS = [
  { n: 1, nome: "RH como acionista do negócio", papel: "Parceiro Estratégico", valor: "Co-define estratégia e leva people analytics e métricas de impacto à mesa de decisão." },
  { n: 2, nome: "Excelência operacional digital", papel: "Especialista Administrativo", valor: "Automação e IA eliminam o repetitivo e liberam tempo para o estratégico." },
  { n: 3, nome: "Arquitetura da experiência do colaborador (EX)", papel: "Campeão dos Funcionários", valor: "Escuta contínua, engajamento, bem-estar e desenvolvimento." },
  { n: 4, nome: "Líder de transformação e agilidade", papel: "Agente de Mudança", valor: "Cultura, adaptação contínua e gestão da mudança em ritmo acelerado." },
] as const;

export const DIMENSOES = [
  { n: 1, eixo: 1, nome: "Conexão RH-estratégia" },
  { n: 2, eixo: 1, nome: "Planejamento de força de trabalho" },
  { n: 3, eixo: 1, nome: "People analytics e métricas de impacto" },
  { n: 4, eixo: 2, nome: "Eficiência e processos" },
  { n: 5, eixo: 2, nome: "Automação e IA no transacional" },
  { n: 6, eixo: 2, nome: "Governança de dados e conformidade" },
  { n: 7, eixo: 3, nome: "Clima e engajamento" },
  { n: 8, eixo: 3, nome: "Escuta ativa e comunicação" },
  { n: 9, eixo: 3, nome: "Desenvolvimento e carreira" },
  { n: 10, eixo: 4, nome: "Cultura e valores" },
  { n: 11, eixo: 4, nome: "Gestão da mudança" },
  { n: 12, eixo: 4, nome: "Agilidade organizacional" },
] as const;

/** Teaser público: afirmações 1, 9, 10, 13, 17, 25, 30, 33, 37, 41 (texto exato do questionário). */
export const TEASER = [
  { numero: 1, afirmacao: "O RH participa da definição da estratégia da empresa e das prioridades anuais do negócio." },
  { numero: 9, afirmacao: "O RH usa dados para apoiar decisões de pessoas (retenção, desempenho, remuneração, clima)." },
  { numero: 10, afirmacao: "As decisões de negócio incluem indicadores de pessoas, como produtividade, rotatividade e engajamento." },
  { numero: 13, afirmacao: "Os processos de RH (admissão, férias, ponto, folha, benefícios) são padronizados e ágeis." },
  { numero: 17, afirmacao: "O RH utiliza automação e IA para eliminar tarefas repetitivas e liberar tempo para atuação estratégica." },
  { numero: 25, afirmacao: "A empresa mede o clima e o engajamento de forma contínua — não só em pesquisa anual." },
  { numero: 30, afirmacao: "O RH e os gestores escutam as equipes antes de decidir mudanças que as afetam." },
  { numero: 33, afirmacao: "O colaborador tem clareza de como crescer e se desenvolver na empresa." },
  { numero: 37, afirmacao: "Os valores da empresa não ficam só no site: orientam decisões, contratações e reconhecimento." },
  { numero: 41, afirmacao: "Quando a empresa passa por uma mudança, o RH lidera o engajamento das pessoas — não só comunica." },
] as const;

export const LIKERT = [
  { v: 1, label: "Discordo totalmente" },
  { v: 2, label: "Discordo" },
  { v: 3, label: "Neutro" },
  { v: 4, label: "Concordo" },
  { v: 5, label: "Concordo totalmente" },
] as const;

export const LGPD_VERSAO = "maturidade-v1-2026-09";

export const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export type DimMedia = { dimensao: number; grupo: "rh" | "gestor"; media: number };
export type DimScore = {
  n: number; eixo: number; nome: string;
  rh: number | null; gestores: number | null; geral: number | null; gap: number | null; nivel: NivelKey | null;
};

/** Monta o scorecard só a partir de médias por dimensão/grupo (nunca respostas individuais). */
export function montarScorecard(linhas: DimMedia[]) {
  const dims: DimScore[] = DIMENSOES.map((d) => {
    const rh = linhas.find((l) => l.dimensao === d.n && l.grupo === "rh")?.media ?? null;
    const g = linhas.find((l) => l.dimensao === d.n && l.grupo === "gestor")?.media ?? null;
    const rhN = rh == null ? null : Number(rh);
    const gN = g == null ? null : Number(g);
    const geral = media([rhN, gN].filter((x): x is number => x != null));
    return {
      n: d.n, eixo: d.eixo, nome: d.nome, rh: rhN, gestores: gN, geral,
      gap: rhN != null && gN != null ? gN - rhN : null,
      nivel: geral == null ? null : nivelDoScore(geral),
    };
  });
  const comDados = dims.filter((d) => d.geral != null);
  const global = media(comDados.map((d) => d.geral!));
  const eixos = EIXOS.map((e) => {
    const m = media(dims.filter((d) => d.eixo === e.n && d.geral != null).map((d) => d.geral!));
    return { ...e, media: m, nivel: m == null ? null : nivelDoScore(m) };
  });
  const ordenadas = [...comDados].sort((a, b) => a.geral! - b.geral! || a.n - b.n);
  return {
    dims, eixos, global,
    nivelGlobal: global == null ? null : nivelDoScore(global),
    maisCritica: ordenadas[0] ?? null,
    maisForte: ordenadas.length ? [...comDados].sort((a, b) => b.geral! - a.geral! || a.n - b.n)[0] : null,
    criticas: ordenadas.slice(0, 3),
  };
}

/** Faixa de cor: vermelho até 2,6 · amarelo até 3,4 · verde acima. */
export const corDoScore = (s: number | null) =>
  s == null ? "muted" : s <= 2.6 ? "critico" : s <= 3.4 ? "alerta" : "sucesso";

export const RECOMENDACOES: Record<number, string> = {
  1: "Levar o RH ao ritual de planejamento estratégico e desdobrar as prioridades do negócio em metas de pessoas.",
  2: "Montar o plano de força de trabalho por cenários e mapear competências críticas para 2–3 anos.",
  3: "Definir um painel mínimo de indicadores de pessoas ligado a resultados e revisá-lo com a liderança.",
  4: "Mapear e padronizar os processos de RH de maior volume, com prazos e responsáveis claros.",
  5: "Priorizar 2–3 rotinas repetitivas para automação e medir o tempo liberado.",
  6: "Inventariar dados de pessoas, acessos e bases legais (LGPD) e publicar as políticas atualizadas.",
  7: "Adotar escuta contínua (pulsos curtos) e transformar resultados em planos de ação por área.",
  8: "Criar canais seguros de feedback e ritual de devolutiva das lideranças às equipes.",
  9: "Construir trilhas de carreira e PDIs a partir de lacunas reais de competências.",
  10: "Traduzir valores em comportamentos observáveis e usá-los em contratação e reconhecimento.",
  11: "Estabelecer um roteiro padrão de gestão da mudança com análise de impacto nas pessoas.",
  12: "Revisar estrutura e modelo de trabalho para reduzir camadas e acelerar decisões de pessoas.",
};

export const ROADMAP_90: Record<number, [string, string, string]> = {
  1: ["Entrevistar a liderança sobre prioridades do ano", "Desdobrar 3 prioridades em metas de pessoas", "Apresentar o plano de pessoas no comitê executivo"],
  2: ["Mapear posições-chave e riscos de reposição", "Levantar competências críticas futuras", "Aprovar plano de sucessão e força de trabalho"],
  3: ["Escolher 5 indicadores de pessoas prioritários", "Consolidar fontes e validar a qualidade dos dados", "Publicar painel mensal para gestores"],
  4: ["Mapear os 5 processos de maior volume", "Padronizar fluxos, prazos e responsáveis", "Medir retrabalho e tempo de ciclo"],
  5: ["Listar tarefas repetitivas do time de RH", "Automatizar as 2 de maior impacto", "Medir horas liberadas e reinvestir no estratégico"],
  6: ["Inventariar dados e acessos de pessoas", "Revisar bases legais e políticas (LGPD)", "Publicar políticas atualizadas e treinar gestores"],
  7: ["Lançar pulso curto de engajamento", "Devolver resultados às equipes", "Acompanhar planos de ação por área"],
  8: ["Abrir canal seguro de feedback", "Treinar gestores em escuta ativa", "Instituir ritual mensal de devolutiva"],
  9: ["Mapear lacunas de competências por área", "Desenhar trilhas e PDIs prioritários", "Priorizar vagas internas antes do mercado"],
  10: ["Traduzir valores em comportamentos", "Incluir valores em contratação e reconhecimento", "Avaliar lideranças pelos comportamentos"],
  11: ["Definir roteiro padrão de gestão da mudança", "Preparar gestores para conduzir mudanças", "Medir absorção da mudança e ajustar"],
  12: ["Revisar camadas e fluxos de decisão", "Definir regras claras do modelo de trabalho", "Reduzir o tempo de decisões de pessoas"],
};
