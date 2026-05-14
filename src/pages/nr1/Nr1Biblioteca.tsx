import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { BookOpen, FlaskConical, Library, Search, ExternalLink, FileText, AlertTriangle } from 'lucide-react';

// ============ FATORES DE RISCO PSICOSSOCIAL (NR-1) ============
type FatorRisco = { perigo: string; consequencia: string };

const FATORES_RISCO: FatorRisco[] = [
  { perigo: 'Assédio de qualquer natureza no trabalho', consequencia: 'Transtorno mental' },
  { perigo: 'Má gestão de mudanças organizacionais', consequencia: 'Transtorno mental; DORT' },
  { perigo: 'Baixa clareza de papel/função', consequencia: 'Transtorno mental' },
  { perigo: 'Baixas recompensas e reconhecimento', consequencia: 'Transtorno mental' },
  { perigo: 'Falta de suporte/apoio no trabalho', consequencia: 'Transtorno mental' },
  { perigo: 'Baixo controle no trabalho / Falta de autonomia', consequencia: 'Transtorno mental; DORT' },
  { perigo: 'Baixa justiça organizacional', consequencia: 'Transtorno mental' },
  { perigo: 'Eventos violentos ou traumáticos', consequencia: 'Transtorno mental' },
  { perigo: 'Baixa demanda no trabalho (subcarga)', consequencia: 'Transtorno mental' },
  { perigo: 'Excesso de demandas no trabalho (sobrecarga)', consequencia: 'Transtorno mental; DORT' },
  { perigo: 'Más relacionamentos no local de trabalho', consequencia: 'Transtorno mental' },
  { perigo: 'Trabalho em condições de difícil comunicação', consequencia: 'Transtorno mental' },
  { perigo: 'Trabalho remoto e isolado', consequencia: 'Transtorno mental; Fadiga' },
];

// ============ METODOLOGIAS ============
type Metodologia = {
  sigla: string;
  nome: string;
  origem: string;
  proposito: string;
  comoUsamos: string;
  baseLegal?: string;
  referencia: string;
  formulas?: { label: string; expr: string; nota?: string }[];
};

const METODOLOGIAS: Metodologia[] = [
  {
    sigla: 'COPSOQ-III',
    nome: 'Copenhagen Psychosocial Questionnaire (versão III)',
    origem: 'Instituto Nacional de Saúde Ocupacional da Dinamarca (NRCWE), 2019.',
    proposito: 'Avaliar fatores psicossociais no trabalho em 6 dimensões: Demandas, Organização e Conteúdo, Relações e Liderança, Interface Trabalho-Indivíduo, Valores no Trabalho e Saúde e Bem-Estar.',
    comoUsamos: 'Base do diagnóstico psicossocial NR-1. Cada questão é pontuada de 0 a 4 e convertida em score 0-100 por dimensão. Risco classificado em Baixo (≤25), Moderado (26-50), Alto (51-75) e Crítico (>75).',
    baseLegal: 'NR-1, item 1.5.3.2 — identificação de perigos e avaliação de riscos psicossociais.',
    referencia: 'Burr, H. et al. (2019). The Third Version of the Copenhagen Psychosocial Questionnaire. Safety and Health at Work, 10(4).',
  },
  {
    sigla: 'HSE',
    nome: 'Health and Safety Executive — Management Standards',
    origem: 'Health and Safety Executive (Reino Unido), 2004.',
    proposito: 'Framework regulatório britânico para identificar e gerenciar riscos psicossociais em 7 áreas: Demandas, Controle, Apoio, Relacionamentos, Papel, Mudança e Comunicação.',
    comoUsamos: 'Complementa o COPSOQ-III na construção do plano de ação, oferecendo benchmarks e thresholds de gestão. Usamos a escala de 1-5 do HSE para validar prioridades.',
    referencia: 'HSE (2019). Tackling work-related stress using the Management Standards approach. HSE Books.',
  },
  {
    sigla: 'ISO 45003',
    nome: 'ISO 45003:2021 — Saúde e Segurança Psicológica no Trabalho',
    origem: 'Organização Internacional de Normalização (ISO), 2021.',
    proposito: 'Fornecer orientações práticas para identificar, avaliar e controlar riscos psicossociais no trabalho dentro de um sistema de gestão de SST. Aborda design de cargos, carga de trabalho, controle, apoio social, violência e assédio.',
    comoUsamos: 'Referência normativa internacional que fundamenta as práticas do módulo NR-1 perante fiscalização. Usada para validar o PGR, a avaliação de riscos psicossociais e a implementação de controles organizacionais.',
    baseLegal: 'NR-1 (itens 1.5.3 e 1.5.4) — identificação e controle de riscos psicossociais.',
    referencia: 'ISO 45003:2021. Occupational health and safety management — Psychological health and safety at work — Guidelines.',
  },
  {
    sigla: 'SRQ-20',
    nome: 'Self-Reporting Questionnaire (20 itens)',
    origem: 'Organização Mundial da Saúde (OMS), 1994.',
    proposito: 'Triagem (rastreio) de transtornos mentais comuns: ansiedade, depressão e somatização.',
    comoUsamos: 'Aplicado de forma anônima e voluntária. Resultados agregados orientam a indicação de cuidado clínico via SESMT/EAP. Nunca usado para decisão individual.',
    baseLegal: 'NR-7 (PCMSO) e Política Nacional de Saúde Mental.',
    referencia: 'Mari, J.J., Williams, P. (1986). A validity study of a psychiatric screening questionnaire (SRQ-20). British Journal of Psychiatry.',
  },
  {
    sigla: 'DASS-21',
    nome: 'Depression, Anxiety and Stress Scale (21 itens)',
    origem: 'Lovibond & Lovibond, University of New South Wales, 1995.',
    proposito: 'Mensurar gravidade de sintomas de Depressão, Ansiedade e Estresse em 3 subescalas independentes.',
    comoUsamos: 'Rastreio voluntário complementar ao SRQ-20. Bandas: Normal, Leve, Moderado, Severo, Extremamente Severo. Resultados anônimos compõem indicador agregado de saúde mental.',
    referencia: 'Lovibond, S.H. & Lovibond, P.F. (1995). Manual for the Depression Anxiety Stress Scales (2nd ed.). Psychology Foundation.',
  },
  {
    sigla: 'FIB',
    nome: 'Fator de Bem-Estar Integral',
    origem: 'Metodologia proprietária CompSmart, 2026.',
    proposito: 'Indicador composto que integra 4 vetores: Físico, Emocional, Social e Propósito (modelo PERMA-adaptado de Seligman).',
    comoUsamos: 'Calculado a partir de 24 questões da escala 0-4. Apresentado em radar para visualizar equilíbrio entre os vetores e identificar áreas de intervenção do programa de saúde.',
    referencia: 'Seligman, M.E.P. (2011). Flourish: A Visionary New Understanding of Happiness and Well-being. Free Press.',
  },
  {
    sigla: 'ISP',
    nome: 'Índice de Segurança Psicológica',
    origem: 'Adaptado de Edmondson (Harvard Business School), 1999.',
    proposito: 'Medir o quanto colaboradores se sentem seguros para expressar opiniões, admitir erros e propor ideias sem medo de punição.',
    comoUsamos: 'Score de 0-100 por equipe/área (mín. 5 respondentes para anonimato). Meta CompSmart: ISP ≥ 70. Vincula-se a 20% do bônus do gestor no módulo ICP.',
    referencia: 'Edmondson, A.C. (1999). Psychological Safety and Learning Behavior in Work Teams. Administrative Science Quarterly, 44(2).',
  },
  {
    sigla: 'eNPS',
    nome: 'Employee Net Promoter Score',
    origem: 'Adaptado do NPS de Reichheld (Bain & Company), 2003.',
    proposito: 'Medir lealdade e engajamento do colaborador a partir da pergunta: "De 0 a 10, o quanto recomendaria esta empresa como lugar para trabalhar?"',
    comoUsamos: 'eNPS = % Promotores (9-10) − % Detratores (0-6). Bandas: Excelente (>50), Bom (10-50), Regular (0-10), Crítico (<0). Acompanhado mensalmente.',
    referencia: 'Reichheld, F. (2003). The One Number You Need to Grow. Harvard Business Review.',
  },
  {
    sigla: 'MCPS',
    nome: 'Matriz Cruzada Performance × Saúde',
    origem: 'Metodologia proprietária CompSmart, 2026 (inspirada em Talent Intelligence Systems — Bersin).',
    proposito: 'Cruzar score de saúde psicossocial (eixo X) com score de performance/entrega (eixo Y) em 4 quadrantes: Vitalidade, Alerta, Estagnação, Crítico.',
    comoUsamos: 'Permite priorizar intervenções por área. Áreas em "Crítico" (alta entrega + baixa saúde) recebem plano de ação imediato com foco em sustentabilidade.',
    referencia: 'Bersin, J. (2022). Talent Intelligence: A New Discipline for People-Driven Companies. The Josh Bersin Company.',
  },
  {
    sigla: 'CCR',
    nome: 'Calculadora Custo do Risco',
    origem: 'Metodologia proprietária CompSmart, 2026 (baseada em SHRM, Mercer Health on Demand e WorldatWork).',
    proposito: 'Quantificar em R$ o impacto financeiro dos riscos psicossociais: turnover (≈6 meses de salário por reposição), absenteísmo (dias perdidos × custo/dia) e sinistralidade (~3% da folha em casos de risco de saúde mental).',
    comoUsamos: 'Card interativo na página Vitalidade. Compara custo atual vs. economia projetada com plano de ação. Meta: ROI ≥ 2:1 sobre o investimento em programas de saúde mental.',
    formulas: [
      { label: 'Folha anual', expr: 'Headcount × Salário médio × 13,33', nota: '12 meses + 13º + 1/3 férias.' },
      { label: 'Custo de Turnover', expr: '(Headcount × Turnover %) × Salário médio × 6', nota: '~6 salários por reposição (recrutamento, onboarding, curva de aprendizagem) — SHRM.' },
      { label: 'Custo de Absenteísmo', expr: 'Headcount × Dias ausentes/colab/ano × (Salário médio ÷ 22)', nota: '22 = dias úteis médios/mês; custo/dia = salário ÷ 22.' },
      { label: 'Custo de Sinistralidade', expr: 'Folha anual × 3%', nota: 'Estimativa Mercer 2023: impacto saúde mental ≈ 3% da folha em casos de risco.' },
      { label: 'Custo total anual', expr: 'Turnover + Absenteísmo + Sinistralidade', nota: 'Soma dos três vetores de perda.' },
      { label: 'Economia potencial', expr: 'Custo total × Redução esperada %', nota: 'Redução típica observada com programas estruturados de saúde mental: 30-50%.' },
      { label: 'ROI estimado', expr: 'Economia ÷ (Folha anual × 0,5%)', nota: 'Investimento de referência: ~0,5% da folha em programa de saúde mental e bem-estar.' },
    ],
    referencia: 'SHRM (2022). The Cost of Replacing Employees. & Mercer (2023). Health on Demand Report.',
  },
  {
    sigla: 'PGE',
    nome: 'Programa de Gestão Estratégica de Saúde Mental',
    origem: 'Adaptado da Arquitetura de Vitalidade Organizacional, 2026.',
    proposito: 'Estruturar ciclo PDCA (Plan-Do-Check-Act) específico para gestão de riscos psicossociais com 5 etapas: Diagnóstico → Plano → Execução → Monitoramento → Revisão.',
    comoUsamos: 'Trilha de implementação visível na aba "Etapas" do módulo NR-1. Cada etapa tem entregáveis, responsáveis e prazos auditáveis.',
    baseLegal: 'NR-1, itens 1.5.4 e 1.5.5 — implementação de medidas de prevenção.',
    referencia: 'Manual Técnico do Consultor — Arquitetura de Vitalidade Organizacional (CompSmart, 2026).',
  },
  {
    sigla: 'LGPD-Anon',
    nome: 'Anonimização LGPD para diagnósticos psicossociais',
    origem: 'Lei nº 13.709/2018 (LGPD), Art. 12.',
    proposito: 'Garantir que respostas individuais não possam ser reidentificadas, mesmo por administradores.',
    comoUsamos: 'Hash SHA-256 do (user_id + diagnostico_id) como respondent_hash. Mínimo de 5 respondentes por recorte para exibir resultado. Dados clínicos (SRQ/DASS) jamais por colaborador identificável.',
    baseLegal: 'LGPD Art. 11 (dados sensíveis de saúde) e Art. 12 (anonimização).',
    referencia: 'ANPD (2023). Guia Orientativo: Tratamento de Dados Pessoais para Fins Acadêmicos e de Pesquisa.',
  },
  {
    sigla: 'PDCA',
    nome: 'Plan-Do-Check-Act (Ciclo de Deming)',
    origem: 'W. Edwards Deming, 1950 (a partir do ciclo de Shewhart).',
    proposito: 'Modelo de melhoria contínua aplicado ao SST (Sistema de Saúde e Segurança do Trabalho).',
    comoUsamos: 'Estrutura todo o módulo NR-1: Plan (Diagnóstico) → Do (Plano de Ação) → Check (Inteligência/KPIs) → Act (Revisão de ciclo).',
    baseLegal: 'NR-1, item 1.5.3 (GRO — Gerenciamento de Riscos Ocupacionais).',
    referencia: 'Deming, W.E. (1986). Out of the Crisis. MIT Press.',
  },
];

// ============ SIGLAS ============
type Sigla = { sigla: string; significado: string; descricao: string };

const SIGLAS: Sigla[] = [
  { sigla: 'NR-1', significado: 'Norma Regulamentadora nº 1', descricao: 'Norma do MTE que estabelece disposições gerais sobre SST. Atualizada pela Portaria MTE 1.419/2024 que incluiu os riscos psicossociais.' },
  { sigla: 'NR-7', significado: 'PCMSO — Programa de Controle Médico de Saúde Ocupacional', descricao: 'Norma que obriga a empresa a manter programa de monitoramento da saúde dos trabalhadores.' },
  { sigla: 'NR-17', significado: 'Ergonomia', descricao: 'Norma sobre adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores.' },
  { sigla: 'GRO', significado: 'Gerenciamento de Riscos Ocupacionais', descricao: 'Sistema obrigatório (NR-1) que abrange identificação, avaliação, controle e monitoramento de riscos.' },
  { sigla: 'PGR', significado: 'Programa de Gerenciamento de Riscos', descricao: 'Documento que descreve o GRO da empresa, incluindo riscos psicossociais a partir de 2026.' },
  { sigla: 'SESMT', significado: 'Serviço Especializado em Segurança e Medicina do Trabalho', descricao: 'Equipe técnica obrigatória dependendo do porte e grau de risco da empresa.' },
  { sigla: 'CIPA', significado: 'Comissão Interna de Prevenção de Acidentes e de Assédio', descricao: 'Comissão paritária empregador-empregado com novas atribuições de prevenção ao assédio (Lei 14.457/2022).' },
  { sigla: 'EAP', significado: 'Employee Assistance Program (Programa de Apoio ao Empregado)', descricao: 'Serviço externo de apoio psicológico, jurídico e financeiro confidencial ao colaborador.' },
  { sigla: 'eSocial S-2240', significado: 'Evento de Condições Ambientais do Trabalho', descricao: 'Evento do eSocial onde se declaram exposições a agentes nocivos, incluindo psicossociais.' },
  { sigla: 'LGPD', significado: 'Lei Geral de Proteção de Dados (Lei 13.709/2018)', descricao: 'Lei brasileira que regula o tratamento de dados pessoais. Dados de saúde mental são sensíveis (Art. 11).' },
  { sigla: 'ANPD', significado: 'Autoridade Nacional de Proteção de Dados', descricao: 'Órgão fiscalizador da LGPD.' },
  { sigla: 'MTE', significado: 'Ministério do Trabalho e Emprego', descricao: 'Órgão federal responsável pela fiscalização das NRs.' },
  { sigla: 'AFT', significado: 'Auditor Fiscal do Trabalho', descricao: 'Servidor do MTE responsável pela fiscalização in loco.' },
  { sigla: 'COPSOQ', significado: 'Copenhagen Psychosocial Questionnaire', descricao: 'Instrumento internacional de avaliação de fatores psicossociais.' },
  { sigla: 'HSE', significado: 'Health and Safety Executive', descricao: 'Agência regulatória britânica de SST.' },
  { sigla: 'SRQ-20', significado: 'Self-Reporting Questionnaire (20 itens)', descricao: 'Instrumento da OMS para rastreio de transtornos mentais comuns.' },
  { sigla: 'DASS-21', significado: 'Depression, Anxiety and Stress Scale (21 itens)', descricao: 'Escala para avaliação de sintomas de depressão, ansiedade e estresse.' },
  { sigla: 'FIB', significado: 'Fator de Bem-Estar Integral', descricao: 'Indicador composto CompSmart (Físico, Emocional, Social, Propósito).' },
  { sigla: 'ISP', significado: 'Índice de Segurança Psicológica', descricao: 'Score 0-100 de segurança psicológica por equipe.' },
  { sigla: 'eNPS', significado: 'Employee Net Promoter Score', descricao: 'Indicador de lealdade do colaborador.' },
  { sigla: 'MCPS', significado: 'Matriz Cruzada Performance × Saúde', descricao: 'Visualização em quadrantes para priorização de intervenções.' },
  { sigla: 'CCR', significado: 'Calculadora Custo do Risco', descricao: 'Quantificação financeira do impacto dos riscos psicossociais (turnover, absenteísmo e sinistralidade).' },
  { sigla: 'PGE', significado: 'Programa de Gestão Estratégica', descricao: 'Ciclo estruturado de gestão de riscos psicossociais.' },
  { sigla: 'ISO 45003', significado: 'Norma ISO sobre Saúde e Segurança Psicológica no Trabalho', descricao: 'Guia internacional (2021) para identificação, avaliação e controle de riscos psicossociais dentro de um sistema de gestão de SST. Base técnica para fundamentar o PGR da NR-1.' },
  { sigla: 'PDCA', significado: 'Plan-Do-Check-Act', descricao: 'Ciclo de melhoria contínua de Deming.' },
  { sigla: 'PDI', significado: 'Plano de Desenvolvimento Individual', descricao: 'Documento que descreve metas de desenvolvimento do colaborador.' },
  { sigla: 'SST', significado: 'Saúde e Segurança do Trabalho', descricao: 'Conjunto de normas e práticas para preservação da saúde do trabalhador.' },
  { sigla: 'INSS', significado: 'Instituto Nacional do Seguro Social', descricao: 'Autarquia que classifica empresas em Graus de Risco (1 a 4) para fins de SAT/RAT.' },
  { sigla: 'Grau de Risco INSS', significado: 'Classificação da atividade econômica', descricao: 'Grau 1 (Leve), 2 (Médio), 3 (Grave), 4 (Máximo) — define alíquota SAT/RAT e exigências de SESMT.' },
  { sigla: 'CID-10/CID-11', significado: 'Classificação Internacional de Doenças', descricao: 'Códigos OMS usados para registro de afastamentos por transtornos mentais (F00-F99).' },
  { sigla: 'Burnout', significado: 'Síndrome do Esgotamento Profissional (CID-11: QD85)', descricao: 'Reconhecida pela OMS desde 2022 como fenômeno ocupacional.' },
];

// ============ BIBLIOTECA ============
type Livro = {
  titulo: string;
  autor: string;
  ano: number;
  categoria: 'Saúde Mental' | 'Liderança' | 'Cultura' | 'Performance' | 'Direito' | 'Metodologia';
  resumo: string;
  link: string;
};

const LIVROS: Livro[] = [
  {
    titulo: 'Por Que Fazemos o Que Fazemos',
    autor: 'Mario Sergio Cortella',
    ano: 2016,
    categoria: 'Cultura',
    resumo: 'Reflexões sobre propósito, ética e sentido no trabalho. Leitura essencial para líderes que querem construir ambientes psicologicamente saudáveis e organizações com vitalidade duradoura.',
    link: 'https://www.amazon.com.br/dp/8551302035',
  },
  {
    titulo: 'A Coragem de Ser Imperfeito',
    autor: 'Brené Brown',
    ano: 2013,
    categoria: 'Saúde Mental',
    resumo: 'Brown revela como a vulnerabilidade — e não a perfeição — é a base da conexão humana e da segurança psicológica. Fundamental para entender o ISP em equipes.',
    link: 'https://www.amazon.com.br/dp/8543108683',
  },
  {
    titulo: 'The Fearless Organization',
    autor: 'Amy C. Edmondson',
    ano: 2018,
    categoria: 'Liderança',
    resumo: 'A criadora do conceito de Segurança Psicológica mostra como construir times que falam, erram e aprendem sem medo. Base teórica do nosso ISP.',
    link: 'https://www.amazon.com.br/dp/1119477247',
  },
  {
    titulo: 'Burnout: O Segredo para Romper o Ciclo do Estresse',
    autor: 'Emily & Amelia Nagoski',
    ano: 2020,
    categoria: 'Saúde Mental',
    resumo: 'As autoras explicam a diferença entre estresse e estressor, e como completar o ciclo do estresse para evitar o burnout. Leitura essencial para o Programa de Bem-Estar.',
    link: 'https://www.amazon.com.br/dp/8543109965',
  },
  {
    titulo: 'Drive — A Surpreendente Verdade Sobre o Que Nos Motiva',
    autor: 'Daniel H. Pink',
    ano: 2009,
    categoria: 'Performance',
    resumo: 'Pink demonstra que autonomia, propósito e domínio motivam mais do que recompensas externas. Insight fundamental para conectar Remuneração ↔ Saúde Mental.',
    link: 'https://www.amazon.com.br/dp/8539004917',
  },
  {
    titulo: 'Florescer (Flourish)',
    autor: 'Martin E. P. Seligman',
    ano: 2011,
    categoria: 'Saúde Mental',
    resumo: 'O pai da Psicologia Positiva apresenta o modelo PERMA (Positive emotion, Engagement, Relationships, Meaning, Accomplishment) — base do nosso FIB.',
    link: 'https://www.amazon.com.br/dp/8580631688',
  },
  {
    titulo: 'Mindset: A Nova Psicologia do Sucesso',
    autor: 'Carol S. Dweck',
    ano: 2017,
    categoria: 'Performance',
    resumo: 'Dweck contrasta mentalidade fixa vs. crescimento. Aplica-se diretamente ao PDI, sucessão e cultura de aprendizagem segura.',
    link: 'https://www.amazon.com.br/dp/8547000267',
  },
  {
    titulo: 'Lost Connections',
    autor: 'Johann Hari',
    ano: 2018,
    categoria: 'Saúde Mental',
    resumo: 'Hari investiga as causas sociais e organizacionais da depressão e ansiedade modernas, com forte crítica ao isolamento no trabalho. Essencial para entender riscos psicossociais.',
    link: 'https://www.amazon.com.br/dp/1408878690',
  },
  {
    titulo: 'A Arte de Cuidar de Si Mesmo no Trabalho',
    autor: 'Ana Beatriz Barbosa Silva',
    ano: 2019,
    categoria: 'Saúde Mental',
    resumo: 'Psiquiatra brasileira referência em saúde mental no trabalho aborda burnout, ansiedade e estratégias práticas de autocuidado em ambientes corporativos exigentes.',
    link: 'https://www.amazon.com.br/dp/8525067962',
  },
  {
    titulo: 'Manual de Saúde Mental no Trabalho',
    autor: 'Duílio Antero de Camargo',
    ano: 2021,
    categoria: 'Direito',
    resumo: 'Obra técnica que conecta legislação trabalhista, NR-1, CID-11 e práticas de prevenção. Referência para a área de SST e RH na adequação à NR-1.',
    link: 'https://www.amazon.com.br/dp/6555153342',
  },
  {
    titulo: 'Reinventando as Organizações',
    autor: 'Frederic Laloux',
    ano: 2014,
    categoria: 'Cultura',
    resumo: 'Laloux apresenta organizações Teal — autogestionadas, com propósito evolutivo e plenitude. Modelo inspirador para empresas que querem ir além da conformidade NR-1.',
    link: 'https://www.amazon.com.br/dp/8568014046',
  },
  {
    titulo: 'Liderança: A Inteligência Emocional na Formação do Líder de Sucesso',
    autor: 'Daniel Goleman',
    ano: 2015,
    categoria: 'Liderança',
    resumo: 'Goleman compila décadas de pesquisa sobre como inteligência emocional do líder afeta diretamente o clima e a saúde mental da equipe.',
    link: 'https://www.amazon.com.br/dp/8539006359',
  },
  {
    titulo: 'O Poder do Hábito',
    autor: 'Charles Duhigg',
    ano: 2012,
    categoria: 'Performance',
    resumo: 'Duhigg explica como hábitos individuais e organizacionais se formam — base para criar rituais de check-in de vitalidade e cultura de cuidado.',
    link: 'https://www.amazon.com.br/dp/8539004119',
  },
  {
    titulo: 'NR-1 Comentada — Riscos Psicossociais',
    autor: 'João Bosco Ribeiro',
    ano: 2025,
    categoria: 'Direito',
    resumo: 'Análise artigo por artigo da NR-1 atualizada pela Portaria MTE 1.419/2024, com foco em conformidade, evidências documentais e defesa em fiscalização.',
    link: 'https://www.google.com/search?tbm=bks&q=%22NR-1+Comentada%22+Riscos+Psicossociais',
  },
  {
    titulo: 'Talent Intelligence: A New Discipline for People-Driven Companies',
    autor: 'Josh Bersin',
    ano: 2022,
    categoria: 'Metodologia',
    resumo: 'Bersin define a nova disciplina que integra Performance, Remuneração e Saúde em um único sistema de inteligência de talentos — base teórica da Matriz MCPS.',
    link: 'https://joshbersin.com/research/',
  },
];

const CATEGORIAS = ['Todas', 'Saúde Mental', 'Liderança', 'Cultura', 'Performance', 'Direito', 'Metodologia'] as const;

export default function Nr1Biblioteca() {
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState<(typeof CATEGORIAS)[number]>('Todas');

  const metodologiasFiltered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return METODOLOGIAS;
    return METODOLOGIAS.filter(
      (m) =>
        m.sigla.toLowerCase().includes(q) ||
        m.nome.toLowerCase().includes(q) ||
        m.proposito.toLowerCase().includes(q),
    );
  }, [busca]);

  const siglasFiltered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return SIGLAS;
    return SIGLAS.filter(
      (s) =>
        s.sigla.toLowerCase().includes(q) ||
        s.significado.toLowerCase().includes(q) ||
        s.descricao.toLowerCase().includes(q),
    );
  }, [busca]);

  const livrosFiltered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return LIVROS.filter((l) => {
      const matchCat = cat === 'Todas' || l.categoria === cat;
      const matchQ =
        !q ||
        l.titulo.toLowerCase().includes(q) ||
        l.autor.toLowerCase().includes(q) ||
        l.resumo.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [busca, cat]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Library className="h-6 w-6 text-[hsl(var(--nr1-primary))]" />
          Metodologias & Biblioteca
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Documentação técnica das metodologias, instrumentos e literaturas utilizadas no módulo de Saúde Mental.
          Esta página serve como <strong>evidência de fundamentação científica</strong> para auditorias do MTE,
          fiscalizações trabalhistas e adequação à NR-1.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar metodologia, sigla ou livro..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="metodologias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metodologias" className="gap-2">
            <FlaskConical className="h-4 w-4" /> Metodologias ({metodologiasFiltered.length})
          </TabsTrigger>
          <TabsTrigger value="siglas" className="gap-2">
            <FileText className="h-4 w-4" /> Siglas ({siglasFiltered.length})
          </TabsTrigger>
          <TabsTrigger value="biblioteca" className="gap-2">
            <BookOpen className="h-4 w-4" /> Biblioteca ({livrosFiltered.length})
          </TabsTrigger>
          <TabsTrigger value="fatores" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Fatores de Risco ({FATORES_RISCO.length})
          </TabsTrigger>
        </TabsList>

        {/* ====== METODOLOGIAS ====== */}
        <TabsContent value="metodologias" className="space-y-3">
          <Accordion type="multiple" className="space-y-2">
            {metodologiasFiltered.map((m) => (
              <AccordionItem
                key={m.sigla}
                value={m.sigla}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant="outline" className="font-mono shrink-0">
                      {m.sigla}
                    </Badge>
                    <span className="font-semibold">{m.nome}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <Section label="Origem">{m.origem}</Section>
                  <Section label="Propósito">{m.proposito}</Section>
                  <Section label="Como usamos no CompSmart">{m.comoUsamos}</Section>
                  {m.formulas && m.formulas.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Fórmulas de cálculo
                      </p>
                      <div className="space-y-2">
                        {m.formulas.map((f) => (
                          <div key={f.label} className="rounded-md border bg-muted/30 p-2.5">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-xs font-semibold">{f.label}</span>
                              <code className="text-[11px] font-mono bg-background border rounded px-1.5 py-0.5">
                                {f.expr}
                              </code>
                            </div>
                            {f.nota && (
                              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{f.nota}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {m.baseLegal && <Section label="Base legal">{m.baseLegal}</Section>}
                  <Section label="Referência">{m.referencia}</Section>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* ====== SIGLAS ====== */}
        <TabsContent value="siglas">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Glossário de Siglas</CardTitle>
              <CardDescription>
                Todas as siglas e acrônimos utilizados na plataforma e na legislação NR-1.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {siglasFiltered.map((s) => (
                  <div key={s.sigla} className="border rounded-md p-3 bg-card">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-mono">{s.sigla}</Badge>
                      <span className="text-sm font-semibold">{s.significado}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.descricao}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== BIBLIOTECA ====== */}
        <TabsContent value="biblioteca" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={cat === c ? 'default' : 'outline'}
                onClick={() => setCat(c)}
                className={cat === c ? 'bg-[hsl(var(--nr1-primary))] hover:bg-[hsl(var(--nr1-primary)/0.9)]' : ''}
              >
                {c}
              </Button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {livrosFiltered.map((l) => (
              <Card key={l.titulo} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <Badge variant="outline" className="w-fit text-[10px] mb-2">{l.categoria}</Badge>
                  <CardTitle className="text-base leading-snug">{l.titulo}</CardTitle>
                  <CardDescription className="text-xs">
                    {l.autor} · {l.ano}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{l.resumo}</p>
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="self-start px-0 text-[hsl(var(--nr1-primary))] mt-3"
                  >
                    <a href={l.link} target="_blank" rel="noopener noreferrer">
                      Saiba mais <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
            {livrosFiltered.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-10">
                Nenhum livro encontrado com esses filtros.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ====== FATORES DE RISCO ====== */}
        <TabsContent value="fatores">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--nr1-primary))]" />
                13 Fatores de Risco Psicossocial — NR-1
              </CardTitle>
              <CardDescription>
                Lista de perigos (fatores de risco) psicossociais e suas possíveis consequências (lesão ou agravo),
                conforme orientação técnica para o GRO/PGR após a inclusão dos riscos psicossociais na NR-1.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold w-[55%]">Perigo (fator de risco)</th>
                      <th className="text-left px-4 py-2 font-semibold">Possível consequência (lesão ou agravo)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FATORES_RISCO.map((f, i) => (
                      <tr key={f.perigo} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                        <td className="px-4 py-2.5 align-top">{f.perigo}</td>
                        <td className="px-4 py-2.5 align-top text-muted-foreground">{f.consequencia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                <strong>DORT:</strong> Distúrbios Osteomusculares Relacionados ao Trabalho. Esta tabela serve como
                referência para o mapeamento de riscos do PGR e para a fundamentação dos planos de ação do módulo NR-1.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
    <p className="text-sm leading-relaxed">{children}</p>
  </div>
);
