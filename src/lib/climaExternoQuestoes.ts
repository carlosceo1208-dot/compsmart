// External climate / employer-branding 360° survey
// Dimensions oriented to stakeholder perception (clients, suppliers, partners, candidates, alumni)
export type ClimaExternoDimensao =
  | 'reputacao_marca'
  | 'qualidade_entrega'
  | 'relacionamento'
  | 'etica_governanca'
  | 'inovacao'
  | 'responsabilidade_social'
  | 'experiencia_recrutamento';

export const DIMENSAO_EXT_LABEL: Record<ClimaExternoDimensao, string> = {
  reputacao_marca: 'Reputação e Marca Empregadora',
  qualidade_entrega: 'Qualidade da Entrega / Serviço',
  relacionamento: 'Relacionamento e Comunicação',
  etica_governanca: 'Ética, Compliance e Governança',
  inovacao: 'Inovação e Capacidade Técnica',
  responsabilidade_social: 'Responsabilidade Social e ESG',
  experiencia_recrutamento: 'Experiência de Recrutamento (candidatos)',
};

export interface QuestaoExterna {
  id: string;
  dimensao: ClimaExternoDimensao;
  texto: string;
  // visivel para tipos especificos; vazio = todos
  tiposAplicaveis?: Array<'cliente' | 'fornecedor' | 'parceiro' | 'candidato' | 'ex_colaborador' | 'outro'>;
}

export const QUESTOES_EXTERNAS: QuestaoExterna[] = [
  { id: 'rep1', dimensao: 'reputacao_marca', texto: 'A reputação desta empresa no mercado é positiva.' },
  { id: 'rep2', dimensao: 'reputacao_marca', texto: 'Recomendaria esta empresa como bom lugar para trabalhar.' },
  { id: 'rep3', dimensao: 'reputacao_marca', texto: 'A marca desta empresa transmite confiança e credibilidade.' },

  { id: 'qual1', dimensao: 'qualidade_entrega', texto: 'Os produtos / serviços entregues atendem ou superam minhas expectativas.', tiposAplicaveis: ['cliente', 'parceiro'] },
  { id: 'qual2', dimensao: 'qualidade_entrega', texto: 'Prazos e compromissos são cumpridos.', tiposAplicaveis: ['cliente', 'fornecedor', 'parceiro'] },
  { id: 'qual3', dimensao: 'qualidade_entrega', texto: 'Há consistência na qualidade ao longo do tempo.', tiposAplicaveis: ['cliente', 'fornecedor', 'parceiro'] },

  { id: 'rel1', dimensao: 'relacionamento', texto: 'A comunicação é clara, transparente e tempestiva.' },
  { id: 'rel2', dimensao: 'relacionamento', texto: 'As pessoas com quem interajo são acessíveis e cordiais.' },
  { id: 'rel3', dimensao: 'relacionamento', texto: 'Problemas e dúvidas são tratados com agilidade.' },

  { id: 'eti1', dimensao: 'etica_governanca', texto: 'A empresa age com ética e integridade nas negociações.' },
  { id: 'eti2', dimensao: 'etica_governanca', texto: 'Há respeito a contratos, regras e prazos formais.' },

  { id: 'inov1', dimensao: 'inovacao', texto: 'A empresa demonstra capacidade técnica e inovação.' },
  { id: 'inov2', dimensao: 'inovacao', texto: 'Acompanha tendências relevantes do seu setor.' },

  { id: 'esg1', dimensao: 'responsabilidade_social', texto: 'A empresa demonstra preocupação social e ambiental (ESG).' },
  { id: 'esg2', dimensao: 'responsabilidade_social', texto: 'Trata pessoas e parceiros com respeito e equidade.' },

  { id: 'rec1', dimensao: 'experiencia_recrutamento', texto: 'O processo seletivo foi conduzido com transparência e respeito.', tiposAplicaveis: ['candidato'] },
  { id: 'rec2', dimensao: 'experiencia_recrutamento', texto: 'Recebi retornos claros sobre as etapas do processo.', tiposAplicaveis: ['candidato'] },
  { id: 'rec3', dimensao: 'experiencia_recrutamento', texto: 'Como ex-colaborador, recomendaria esta empresa como local de trabalho.', tiposAplicaveis: ['ex_colaborador'] },
];

export const ESCALA = [
  { valor: 1, label: 'Discordo totalmente' },
  { valor: 2, label: 'Discordo' },
  { valor: 3, label: 'Neutro' },
  { valor: 4, label: 'Concordo' },
  { valor: 5, label: 'Concordo totalmente' },
];

export function questoesPorTipo(tipo: string): QuestaoExterna[] {
  return QUESTOES_EXTERNAS.filter(q => !q.tiposAplicaveis || q.tiposAplicaveis.includes(tipo as any));
}

export function calcularScores(respostas: Record<string, number>, questoes: QuestaoExterna[]) {
  const porDim: Record<string, { soma: number; n: number }> = {};
  for (const q of questoes) {
    const v = respostas[q.id];
    if (typeof v === 'number') {
      porDim[q.dimensao] ??= { soma: 0, n: 0 };
      porDim[q.dimensao].soma += v;
      porDim[q.dimensao].n += 1;
    }
  }
  const scores: Record<string, number> = {};
  let total = 0, count = 0;
  for (const [dim, { soma, n }] of Object.entries(porDim)) {
    if (n > 0) {
      scores[dim] = Number((soma / n).toFixed(2));
      total += soma; count += n;
    }
  }
  const geral = count > 0 ? Number((total / count).toFixed(2)) : null;
  return { scores, geral };
}
