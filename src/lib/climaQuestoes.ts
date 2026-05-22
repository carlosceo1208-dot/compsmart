// Pesquisa de Clima Organizacional 360° — 10 dimensões × 6 questões = 60 itens
// Escala Likert 5 pontos. Integrável com COPSOQ-III (riscos psicossociais).

export type ClimaDimensao =
  | 'confianca_lideranca'
  | 'seguranca_psicologica'
  | 'reconhecimento_recompensa'
  | 'comunicacao_interna'
  | 'desenvolvimento_profissional'
  | 'autonomia_empowerment'
  | 'equilibrio_trabalho_vida'
  | 'qualidade_ambiente'
  | 'relacionamento_colegas'
  | 'proposito_alinhamento';

export const DIMENSAO_LABEL: Record<ClimaDimensao, string> = {
  confianca_lideranca: 'Confiança na Liderança',
  seguranca_psicologica: 'Segurança Psicológica e Respeito',
  reconhecimento_recompensa: 'Reconhecimento e Recompensa',
  comunicacao_interna: 'Comunicação Interna',
  desenvolvimento_profissional: 'Desenvolvimento Profissional',
  autonomia_empowerment: 'Autonomia e Empowerment',
  equilibrio_trabalho_vida: 'Equilíbrio Trabalho-Vida',
  qualidade_ambiente: 'Qualidade do Ambiente de Trabalho',
  relacionamento_colegas: 'Relacionamento com Colegas',
  proposito_alinhamento: 'Propósito e Alinhamento',
};

// Mapeamento clima ↔ COPSOQ (para análise integrada)
export const CORRELACAO_COPSOQ: Record<ClimaDimensao, string> = {
  reconhecimento_recompensa: 'Falta de reconhecimento',
  autonomia_empowerment: 'Falta de autonomia',
  equilibrio_trabalho_vida: 'Desequilíbrio trabalho-vida',
  confianca_lideranca: 'Insegurança no emprego',
  comunicacao_interna: 'Falta de clareza de papéis',
  desenvolvimento_profissional: 'Falta de desenvolvimento',
  relacionamento_colegas: 'Falta de suporte social',
  seguranca_psicologica: 'Conflitos / assédio',
  qualidade_ambiente: 'Condições físicas de trabalho',
  proposito_alinhamento: 'Sentido do trabalho',
};

export interface ClimaQuestao {
  dimensao: ClimaDimensao;
  num: number; // 1-6 dentro da dimensão
  texto: string;
}

export const QUESTOES: ClimaQuestao[] = [
  // 1. CONFIANÇA NA LIDERANÇA
  { dimensao: 'confianca_lideranca', num: 1, texto: 'Minha liderança demonstra competência e conhecimento técnico' },
  { dimensao: 'confianca_lideranca', num: 2, texto: 'Minha liderança é justa e imparcial nas decisões' },
  { dimensao: 'confianca_lideranca', num: 3, texto: 'Minha liderança é acessível e disponível quando preciso' },
  { dimensao: 'confianca_lideranca', num: 4, texto: 'Minha liderança reconhece meu trabalho e contribuições' },
  { dimensao: 'confianca_lideranca', num: 5, texto: 'Minha liderança me apoia no desenvolvimento profissional' },
  { dimensao: 'confianca_lideranca', num: 6, texto: 'Tenho confiança na direção que a liderança está dando à organização' },

  // 2. SEGURANÇA PSICOLÓGICA E RESPEITO
  { dimensao: 'seguranca_psicologica', num: 1, texto: 'Sinto-me seguro para expressar minha opinião sem medo de represálias' },
  { dimensao: 'seguranca_psicologica', num: 2, texto: 'Sou respeitado por meus colegas e liderança' },
  { dimensao: 'seguranca_psicologica', num: 3, texto: 'Não sofro discriminação ou assédio moral no trabalho' },
  { dimensao: 'seguranca_psicologica', num: 4, texto: 'Minha diversidade (gênero, etnia, origem) é valorizada' },
  { dimensao: 'seguranca_psicologica', num: 5, texto: 'Posso ser autêntico e verdadeiro no meu trabalho' },
  { dimensao: 'seguranca_psicologica', num: 6, texto: 'Existe um ambiente de inclusão onde todos são bem-vindos' },

  // 3. RECONHECIMENTO E RECOMPENSA
  { dimensao: 'reconhecimento_recompensa', num: 1, texto: 'Meu trabalho é reconhecido e valorizado' },
  { dimensao: 'reconhecimento_recompensa', num: 2, texto: 'Meu salário é justo para a função que executo' },
  { dimensao: 'reconhecimento_recompensa', num: 3, texto: 'Recebo benefícios adequados (saúde, alimentação, etc.)' },
  { dimensao: 'reconhecimento_recompensa', num: 4, texto: 'Tenho oportunidades de bônus ou incentivos' },
  { dimensao: 'reconhecimento_recompensa', num: 5, texto: 'Meu desempenho é avaliado de forma justa' },
  { dimensao: 'reconhecimento_recompensa', num: 6, texto: 'Sou recompensado por meu crescimento e desenvolvimento' },

  // 4. COMUNICAÇÃO INTERNA
  { dimensao: 'comunicacao_interna', num: 1, texto: 'A comunicação interna é clara e transparente' },
  { dimensao: 'comunicacao_interna', num: 2, texto: 'Recebo informações importantes sobre decisões que afetam meu trabalho' },
  { dimensao: 'comunicacao_interna', num: 3, texto: 'Tenho canais para expressar sugestões e feedback' },
  { dimensao: 'comunicacao_interna', num: 4, texto: 'A liderança comunica metas e objetivos de forma clara' },
  { dimensao: 'comunicacao_interna', num: 5, texto: 'Existe alinhamento entre o que é comunicado e o que é praticado' },
  { dimensao: 'comunicacao_interna', num: 6, texto: 'Sinto-me informado sobre o desempenho e situação da organização' },

  // 5. DESENVOLVIMENTO PROFISSIONAL
  { dimensao: 'desenvolvimento_profissional', num: 1, texto: 'Tenho oportunidades de aprender e desenvolver novas habilidades' },
  { dimensao: 'desenvolvimento_profissional', num: 2, texto: 'Recebo treinamento adequado para minha função' },
  { dimensao: 'desenvolvimento_profissional', num: 3, texto: 'Vejo um caminho claro de carreira na organização' },
  { dimensao: 'desenvolvimento_profissional', num: 4, texto: 'A organização investe no meu desenvolvimento profissional' },
  { dimensao: 'desenvolvimento_profissional', num: 5, texto: 'Tenho mentoria ou coaching para crescer' },
  { dimensao: 'desenvolvimento_profissional', num: 6, texto: 'Posso participar de programas de capacitação' },

  // 6. AUTONOMIA E EMPOWERMENT
  { dimensao: 'autonomia_empowerment', num: 1, texto: 'Tenho autonomia para tomar decisões no meu trabalho' },
  { dimensao: 'autonomia_empowerment', num: 2, texto: 'Minha opinião é considerada nas decisões que me afetam' },
  { dimensao: 'autonomia_empowerment', num: 3, texto: 'Posso sugerir melhorias nos processos' },
  { dimensao: 'autonomia_empowerment', num: 4, texto: 'Sou encorajado a tomar iniciativa e inovar' },
  { dimensao: 'autonomia_empowerment', num: 5, texto: 'Não há microgerenciamento excessivo' },
  { dimensao: 'autonomia_empowerment', num: 6, texto: 'Tenho liberdade para executar meu trabalho da forma que acho melhor' },

  // 7. EQUILÍBRIO TRABALHO-VIDA
  { dimensao: 'equilibrio_trabalho_vida', num: 1, texto: 'Consigo manter um equilíbrio saudável entre trabalho e vida pessoal' },
  { dimensao: 'equilibrio_trabalho_vida', num: 2, texto: 'Meu horário de trabalho é respeitado' },
  { dimensao: 'equilibrio_trabalho_vida', num: 3, texto: 'Tenho flexibilidade para trabalhar em horários que funcionam para mim' },
  { dimensao: 'equilibrio_trabalho_vida', num: 4, texto: 'Não sou sobrecarregado com trabalho' },
  { dimensao: 'equilibrio_trabalho_vida', num: 5, texto: 'Tenho tempo para descanso e lazer' },
  { dimensao: 'equilibrio_trabalho_vida', num: 6, texto: 'A organização respeita minha vida pessoal e familiar' },

  // 8. QUALIDADE DO AMBIENTE
  { dimensao: 'qualidade_ambiente', num: 1, texto: 'Tenho ferramentas e recursos adequados para executar meu trabalho' },
  { dimensao: 'qualidade_ambiente', num: 2, texto: 'O ambiente físico é seguro e confortável' },
  { dimensao: 'qualidade_ambiente', num: 3, texto: 'Tenho acesso a tecnologia atualizada' },
  { dimensao: 'qualidade_ambiente', num: 4, texto: 'O espaço de trabalho é adequado para minha função' },
  { dimensao: 'qualidade_ambiente', num: 5, texto: 'Existem políticas de saúde e segurança efetivas' },
  { dimensao: 'qualidade_ambiente', num: 6, texto: 'A organização cuida da saúde e bem-estar dos colaboradores' },

  // 9. RELACIONAMENTO COM COLEGAS
  { dimensao: 'relacionamento_colegas', num: 1, texto: 'Tenho bom relacionamento com meus colegas' },
  { dimensao: 'relacionamento_colegas', num: 2, texto: 'Trabalho em um ambiente colaborativo' },
  { dimensao: 'relacionamento_colegas', num: 3, texto: 'Existe espírito de equipe e solidariedade' },
  { dimensao: 'relacionamento_colegas', num: 4, texto: 'Sinto-me parte de uma comunidade' },
  { dimensao: 'relacionamento_colegas', num: 5, texto: 'Meus colegas me apoiam quando preciso' },
  { dimensao: 'relacionamento_colegas', num: 6, texto: 'Não há conflitos destrutivos entre colegas' },

  // 10. PROPÓSITO E ALINHAMENTO
  { dimensao: 'proposito_alinhamento', num: 1, texto: 'Entendo a missão e visão da organização' },
  { dimensao: 'proposito_alinhamento', num: 2, texto: 'Meus valores pessoais estão alinhados com os da organização' },
  { dimensao: 'proposito_alinhamento', num: 3, texto: 'Meu trabalho tem propósito e significado' },
  { dimensao: 'proposito_alinhamento', num: 4, texto: 'Contribuo para algo maior que eu mesmo' },
  { dimensao: 'proposito_alinhamento', num: 5, texto: 'Acredito no que a organização faz' },
  { dimensao: 'proposito_alinhamento', num: 6, texto: 'Sinto orgulho de trabalhar nesta organização' },
];

export const ESCALA_OPCOES = [
  { value: 1, label: 'Discordo totalmente' },
  { value: 2, label: 'Discordo' },
  { value: 3, label: 'Neutro' },
  { value: 4, label: 'Concordo' },
  { value: 5, label: 'Concordo totalmente' },
];

export function interpretarClima(score: number | null | undefined): {
  label: string;
  color: 'critico' | 'insatisfatorio' | 'moderado' | 'positivo' | 'excelente' | 'sem_dados';
} {
  if (score == null) return { label: 'Sem dados', color: 'sem_dados' };
  if (score <= 2.0) return { label: 'Crítico — ação urgente', color: 'critico' };
  if (score <= 3.0) return { label: 'Insatisfatório', color: 'insatisfatorio' };
  if (score <= 3.5) return { label: 'Moderado', color: 'moderado' };
  if (score <= 4.2) return { label: 'Positivo', color: 'positivo' };
  return { label: 'Excelente', color: 'excelente' };
}

export function calcularScores(respostas: Record<string, number>): {
  geral: number;
  porDimensao: Record<ClimaDimensao, number>;
} {
  const porDimensao = {} as Record<ClimaDimensao, number>;
  const dimensoes = Object.keys(DIMENSAO_LABEL) as ClimaDimensao[];

  for (const dim of dimensoes) {
    const itens = QUESTOES.filter((q) => q.dimensao === dim);
    const vals = itens.map((q) => respostas[`${q.dimensao}_${q.num}`]).filter((v): v is number => typeof v === 'number');
    porDimensao[dim] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }
  const all = Object.values(respostas).filter((v): v is number => typeof v === 'number');
  const geral = all.length > 0 ? all.reduce((a, b) => a + b, 0) / all.length : 0;
  return { geral, porDimensao };
}
