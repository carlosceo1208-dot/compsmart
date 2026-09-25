export type ImportFieldType =
  | 'text'
  | 'email'
  | 'cpf'
  | 'date'
  | 'number'
  | 'boolean'
  | 'job'
  | 'unit'
  | 'manager';

export interface ImportField {
  /** Chave do campo na plataforma (coluna de profiles, quando aplicável) */
  key: string;
  label: string;
  type: ImportFieldType;
  /** Sinônimos de cabeçalho usados pelos sistemas de folha */
  synonyms: string[];
  hint?: string;
}

/**
 * Catálogo dos campos da plataforma que podem receber dados de uma planilha de
 * folha de pagamento. Os sinônimos cobrem cabeçalhos comuns de TOTVS, Senior,
 * Domínio, ADP e exportações genéricas de Excel.
 */
export const IMPORT_FIELDS: ImportField[] = [
  {
    key: 'employee_number',
    label: 'Matrícula',
    type: 'text',
    synonyms: ['matricula', 'matrícula', 'registro', 'numero de registro', 'nº registro', 'no registro', 're', 'chapa', 'codigo do funcionario', 'cod funcionario', 'id funcionario', 'employee id', 'employee number'],
  },
  {
    key: 'full_name',
    label: 'Nome completo',
    type: 'text',
    synonyms: ['nome', 'nome completo', 'nome do funcionario', 'nome do colaborador', 'colaborador', 'funcionario', 'name', 'full name'],
  },
  {
    key: 'cpf',
    label: 'CPF',
    type: 'cpf',
    synonyms: ['cpf', 'c.p.f', 'cpf do funcionario', 'documento', 'nr cpf'],
  },
  {
    key: 'email',
    label: 'E-mail',
    type: 'email',
    synonyms: ['email', 'e-mail', 'email corporativo', 'e-mail corporativo', 'mail'],
  },
  {
    key: 'phone',
    label: 'Telefone',
    type: 'text',
    synonyms: ['telefone', 'celular', 'fone', 'telefone celular', 'phone'],
  },
  {
    key: 'birth_date',
    label: 'Data de nascimento',
    type: 'date',
    synonyms: ['data de nascimento', 'nascimento', 'dt nascimento', 'data nasc', 'birth date'],
  },
  {
    key: 'hire_date',
    label: 'Data de admissão',
    type: 'date',
    synonyms: ['data de admissao', 'admissao', 'admissão', 'dt admissao', 'data admissao', 'data de ingresso', 'hire date', 'inicio'],
  },
  {
    key: 'termination_date',
    label: 'Data de desligamento',
    type: 'date',
    synonyms: ['demissao', 'demissão', 'data de demissao', 'desligamento', 'data de desligamento', 'dt rescisao', 'termination date'],
  },
  {
    key: 'job_title',
    label: 'Cargo (código ou nome)',
    type: 'job',
    synonyms: ['cargo', 'funcao', 'função', 'cargo atual', 'descricao do cargo', 'codigo do cargo', 'cod cargo', 'job title', 'position'],
    hint: 'Casa com o cargo da plataforma por código ou nome',
  },
  {
    key: 'salary',
    label: 'Salário base',
    type: 'number',
    synonyms: ['salario', 'salário', 'salario base', 'salário base', 'salario fixo', 'vencimento', 'remuneracao', 'remuneração', 'base salary', 'salario nominal'],
  },
  {
    key: 'variable_salary',
    label: 'Salário variável',
    type: 'number',
    synonyms: ['salario variavel', 'variavel', 'variável', 'bonus', 'bônus', 'comissao', 'comissão', 'variable pay'],
  },
  {
    key: 'benefits_value',
    label: 'Valor de benefícios',
    type: 'number',
    synonyms: ['beneficios', 'benefícios', 'valor beneficios', 'total beneficios', 'benefits'],
  },
  {
    key: 'performance_rating',
    label: 'Nota de desempenho',
    type: 'number',
    synonyms: ['desempenho', 'nota de desempenho', 'avaliacao', 'avaliação', 'performance', 'nota'],
  },
  {
    key: 'unit_id',
    label: 'Unidade (código)',
    type: 'unit',
    synonyms: ['unidade', 'codigo unidade', 'cod unidade', 'filial', 'estabelecimento', 'centro de custo', 'ccusto', 'unit'],
    hint: 'Casa com a estrutura organizacional por código',
  },
  {
    key: 'department',
    label: 'Departamento (texto)',
    type: 'text',
    synonyms: ['departamento', 'setor', 'area', 'área', 'diretoria', 'department'],
  },
  {
    key: 'manager_id',
    label: 'Gestor (e-mail)',
    type: 'manager',
    synonyms: ['gestor', 'email do gestor', 'e-mail do gestor', 'superior', 'lider', 'líder', 'chefia', 'manager', 'manager email'],
    hint: 'Casa com o gestor da plataforma pelo e-mail',
  },
  {
    key: 'gender',
    label: 'Gênero',
    type: 'text',
    synonyms: ['genero', 'gênero', 'sexo', 'gender'],
  },
  {
    key: 'work_modality',
    label: 'Modalidade de trabalho',
    type: 'text',
    synonyms: ['modalidade', 'modalidade de trabalho', 'regime', 'presencial/remoto', 'work modality'],
  },
  {
    key: 'shift',
    label: 'Turno',
    type: 'text',
    synonyms: ['turno', 'escala', 'jornada', 'shift'],
  },
  {
    key: 'leadership_level',
    label: 'Nível de liderança',
    type: 'text',
    synonyms: ['nivel de lideranca', 'nível de liderança', 'lideranca', 'nivel hierarquico', 'leadership'],
  },
  {
    key: 'pcd',
    label: 'PCD',
    type: 'boolean',
    synonyms: ['pcd', 'deficiencia', 'deficiência', 'portador de deficiencia', 'disability'],
  },
];

export const IMPORT_FIELD_MAP = new Map(IMPORT_FIELDS.map((f) => [f.key, f]));

export type ColumnMapping = Record<string, string | null>;

export const normalizeHeader = (header: string): string =>
  header
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
