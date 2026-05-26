// Bem-Estar Integral — dimensões, estágios e instrumentos
// Terminologia neutra (sem vínculo com fornecedor específico)

export type FibDimensao =
  | 'bem_estar_psicologico'
  | 'saude'
  | 'uso_do_tempo'
  | 'vitalidade_comunitaria'
  | 'cultura'
  | 'educacao'
  | 'governanca'
  | 'meio_ambiente'
  | 'padrao_de_vida';

export const FIB_DIMENSOES: { key: FibDimensao; label: string; grupo: 'pessoa' | 'organizacao' }[] = [
  { key: 'bem_estar_psicologico', label: 'Bem-Estar Psicológico', grupo: 'pessoa' },
  { key: 'saude', label: 'Saúde', grupo: 'pessoa' },
  { key: 'uso_do_tempo', label: 'Uso do Tempo', grupo: 'pessoa' },
  { key: 'vitalidade_comunitaria', label: 'Vitalidade Comunitária', grupo: 'pessoa' },
  { key: 'cultura', label: 'Cultura', grupo: 'organizacao' },
  { key: 'educacao', label: 'Educação', grupo: 'organizacao' },
  { key: 'governanca', label: 'Governança', grupo: 'organizacao' },
  { key: 'meio_ambiente', label: 'Meio Ambiente', grupo: 'organizacao' },
  { key: 'padrao_de_vida', label: 'Padrão de Vida', grupo: 'organizacao' },
];

export type EstagioSegPsi = 'incluir' | 'aprender' | 'contribuir' | 'desafiar';

export const ESTAGIOS_SEG_PSI: { key: EstagioSegPsi; label: string; descricao: string }[] = [
  { key: 'incluir', label: 'Incluir', descricao: 'Sinto-me aceito e respeitado pelo grupo.' },
  { key: 'aprender', label: 'Aprender', descricao: 'Posso fazer perguntas e errar sem medo.' },
  { key: 'contribuir', label: 'Contribuir', descricao: 'Posso usar minhas habilidades e gerar valor.' },
  { key: 'desafiar', label: 'Desafiar', descricao: 'Posso questionar o status quo com segurança.' },
];

export type Instrumento = {
  key: string;
  nome: string;
  descricao: string;
  itens: number;
  duracao: string;
  categoria: 'bem_estar' | 'seguranca' | 'risco_psicossocial' | 'lealdade' | 'clinico';
};

export const INSTRUMENTOS: Instrumento[] = [
  { key: 'bei_funcionario', nome: 'Bem-Estar Integral — Visão Colaborador', descricao: 'Percepção de bem-estar nas 9 dimensões.', itens: 36, duracao: '8–10 min', categoria: 'bem_estar' },
  { key: 'bei_empresa', nome: 'Bem-Estar Integral — Visão Empresa', descricao: 'Condições oferecidas pela organização.', itens: 36, duracao: '8–10 min', categoria: 'bem_estar' },
  { key: 'seg_psi_4', nome: '4 Estágios de Segurança Psicológica', descricao: 'Incluir, Aprender, Contribuir, Desafiar.', itens: 20, duracao: '5–7 min', categoria: 'seguranca' },
  { key: 'hse_it', nome: 'HSE Indicator Tool', descricao: 'Rastreador quantitativo de riscos psicossociais.', itens: 35, duracao: '8 min', categoria: 'risco_psicossocial' },
  { key: 'copsoq', nome: 'COPSOQ III (curto)', descricao: 'Avaliação de fatores psicossociais no trabalho.', itens: 32, duracao: '7 min', categoria: 'risco_psicossocial' },
  { key: 'enps', nome: 'eNPS — Lealdade do Colaborador', descricao: 'Probabilidade de recomendar a empresa.', itens: 2, duracao: '1 min', categoria: 'lealdade' },
  { key: 'srq20', nome: 'SRQ-20 (OMS)', descricao: 'Rastreio de transtornos mentais comuns.', itens: 20, duracao: '5 min', categoria: 'clinico' },
  { key: 'dass21', nome: 'DASS-21', descricao: 'Depressão, Ansiedade e Estresse.', itens: 21, duracao: '5 min', categoria: 'clinico' },
];

export const CATEGORIA_LABEL: Record<Instrumento['categoria'], string> = {
  bem_estar: 'Bem-Estar Integral',
  seguranca: 'Segurança Psicológica',
  risco_psicossocial: 'Riscos Psicossociais',
  lealdade: 'Lealdade',
  clinico: 'Rastreio Clínico',
};

export const ETAPAS_PROGRAMA = [
  { key: 'preparacao', label: 'Preparação', descricao: 'Letramento, sensibilização da liderança, definição de escopo.' },
  { key: 'mensuracao', label: 'Mensuração', descricao: 'Aplicação dos rastreadores anônimos (LGPD).' },
  { key: 'apreciacao', label: 'Apreciação de Resultados', descricao: 'Leitura executiva, recortes sociodemográficos.' },
  { key: 'conscientizacao', label: 'Conscientização', descricao: 'Devolutivas a líderes e times, plano de ação.' },
  { key: 'transformacao', label: 'Transformação', descricao: 'Execução do plano e novo ciclo de mensuração.' },
  { key: 'gestao_projeto', label: 'Gestão do Projeto', descricao: 'Fechamento do ciclo, consolidação de entregas e relatório final de gestão.' },
];
