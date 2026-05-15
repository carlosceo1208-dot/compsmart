import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, FlaskConical, Library, Search, ExternalLink, FileText, AlertTriangle, BookText, ShieldCheck, Phone } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

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
  {
    sigla: 'RQ',
    nome: 'Racional Questionario — Estrutura das 40 Perguntas NR-1',
    origem: 'COPSOQ-III (Copenhagen Psychosocial Questionnaire, versão III), adaptado para o contexto brasileiro e alinhado aos requisitos da NR-1 (Portaria MTE 1.419/2024).',
    proposito: 'Explicar a arquitetura do questionário aplicado no diagnóstico NR-1: 40 perguntas distribuídas em 6 dimensões psicossociais, com sistema de pesos diferenciados (0,80 a 1,50), escala Likert de 5 pontos e total anonimato (LGPD).',
    comoUsamos: `O questionário é aplicado de forma anônima dentro de ciclos de diagnóstico. As 40 perguntas estão distribuídas assim: Demandas no Trabalho (8), Organização e Conteúdo (7), Relações e Liderança (7), Interface Trabalho-Indivíduo (7), Valores no Trabalho (5) e Saúde e Bem-Estar (6). Cada questão tem peso diferenciado: 1,50 para questões críticas (ex: assédio moral, esgotamento, ansiedade, intenção de demissão), 1,20 para alto impacto (ritmo insustentável, apoio do líder, sono prejudicado), 1,00 para padrão e 0,80 para menor peso. A escala de resposta vai de 0 (Nunca / Discordo totalmente) a 4 (Sempre / Concordo totalmente). O score por dimensão é convertido para escala 0-100 e classificado em Baixo (≤25), Moderado (26-50), Alto (51-75) e Crítico (>75). As respostas individuais são irreversivelmente anonimizadas via hash SHA-256 (user_id + diagnostico_id) — nenhum administrador consegue reidentificar o respondente. Apenas dados agregados por dimensão são exibidos, exigindo mínimo de 5 respondentes por recorte.`,
    baseLegal: 'NR-1, item 1.5.3.2 — identificação de perigos e avaliação de riscos psicossociais. LGPD, Art. 11 (dados sensíveis de saúde) e Art. 12 (anonimização).',
    referencia: 'Burr, H. et al. (2019). The Third Version of the Copenhagen Psychosocial Questionnaire. Safety and Health at Work, 10(4). Adaptação CompSmart 2026.',
  },
  {
    sigla: 'LGPD-NR1',
    nome: 'Privacidade & Anonimato no Diagnóstico Psicossocial',
    origem: 'Lei Geral de Proteção de Dados (Lei 13.709/2018), NR-1 item 1.5.3.2 e ISO 45003:2021 §5.4 (proteção da confidencialidade no relato de riscos psicossociais).',
    proposito: 'Definir como o módulo NR-1 do CompSmart trata dados sensíveis de saúde mental: anonimato por padrão, consentimento explícito, k-anonimato (mínimo 5 respondentes) e regras de cruzamento com liderança direta e RH.',
    comoUsamos: 'Toda resposta de diagnóstico (screening + COPSOQ-III) é gravada apenas com um hash irreversível (respondent_hash) — sem user_id, e-mail, CPF ou nome. Mesmo o super-admin não consegue reabrir uma resposta individual. Antes do primeiro acesso ao módulo, o colaborador precisa aceitar 3 cláusulas (uso, anonimato, revogação) com versionamento (NR1_CONSENT_VERSION); mudança de versão dispara reaceite. Identificação só ocorre se o colaborador autorizar explicitamente vincular o plano de ação ao seu nome (passo 7 do fluxo). Antes disso, dados sobre liderança direta só podem ser cruzados/alertados ao RH em base agregada por equipe (mín. 5 respondentes). O dashboard RH nunca exibe linhas individuais. Direito ao encerramento antecipado (LGPD Art. 18) é lembrado a cada check-in.',
    baseLegal: 'LGPD Art. 7º, 8º e 9º (bases legais e consentimento), Art. 11 (dados sensíveis de saúde), Art. 12 (anonimização), Art. 18 (direitos do titular). NR-1 item 1.5.3.2. ISO 45003:2021 §5.4.',
    referencia: 'Brasil. Lei nº 13.709/2018 (LGPD). ISO 45003:2021. Sweeney, L. (2002). k-anonymity: a model for protecting privacy. International Journal of Uncertainty, Fuzziness and Knowledge-Based Systems, 10(5).',
  },
];
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
  { sigla: 'RQ', significado: 'Racional Questionario', descricao: 'Estrutura das 40 perguntas do diagnóstico NR-1: 6 dimensões, pesos diferenciados (0,80–1,50), escala Likert 0–4 e anonimização LGPD via hash SHA-256.' },
  { sigla: 'PGE', significado: 'Programa de Gestão Estratégica', descricao: 'Ciclo estruturado de gestão de riscos psicossociais.' },
  { sigla: 'ISO 45003', significado: 'Norma ISO sobre Saúde e Segurança Psicológica no Trabalho', descricao: 'Guia internacional (2021) para identificação, avaliação e controle de riscos psicossociais dentro de um sistema de gestão de SST. Base técnica para fundamentar o PGR da NR-1.' },
  { sigla: 'PDCA', significado: 'Plan-Do-Check-Act', descricao: 'Ciclo de melhoria contínua de Deming.' },
  { sigla: 'PDI', significado: 'Plano de Desenvolvimento Individual', descricao: 'Documento que descreve metas de desenvolvimento do colaborador.' },
  { sigla: 'SST', significado: 'Saúde e Segurança do Trabalho', descricao: 'Conjunto de normas e práticas para preservação da saúde do trabalhador.' },
  { sigla: 'INSS', significado: 'Instituto Nacional do Seguro Social', descricao: 'Autarquia que classifica empresas em Graus de Risco (1 a 4) para fins de SAT/RAT.' },
  { sigla: 'Grau de Risco INSS', significado: 'Classificação da atividade econômica', descricao: 'Grau 1 (Leve), 2 (Médio), 3 (Grave), 4 (Máximo) — define alíquota SAT/RAT e exigências de SESMT.' },
  { sigla: 'CID-10/CID-11', significado: 'Classificação Internacional de Doenças', descricao: 'Códigos OMS usados para registro de afastamentos por transtornos mentais (F00-F99).' },
  { sigla: 'Burnout', significado: 'Síndrome do Esgotamento Profissional (CID-11: QD85)', descricao: 'Reconhecida pela OMS desde 2022 como fenômeno ocupacional.' },
  { sigla: 'DPO', significado: 'Data Protection Officer (Encarregado de Dados)', descricao: 'Pessoa indicada pelo controlador para atuar como canal de comunicação entre titulares, ANPD e empresa (LGPD Art. 41).' },
  { sigla: 'CVV', significado: 'Centro de Valorização da Vida', descricao: 'Serviço gratuito de apoio emocional 24h. Telefone 188 (chamada gratuita) ou chat em cvv.org.br. Acionado pelo agente Bem-Estar em casos de risco crítico.' },
  { sigla: 'SAMU', significado: 'Serviço de Atendimento Móvel de Urgência', descricao: 'Telefone 192 — emergência médica (incluindo crises psiquiátricas agudas).' },
  { sigla: 'CAPS', significado: 'Centros de Atenção Psicossocial', descricao: 'Rede pública (SUS) de atendimento em saúde mental para acompanhamento contínuo.' },
  { sigla: 'PCMSO', significado: 'Programa de Controle Médico de Saúde Ocupacional (NR-7)', descricao: 'Programa obrigatório de monitoramento médico dos colaboradores; passa a integrar avaliações de saúde mental a partir da NR-1 atualizada.' },
  { sigla: 'k-anonimato', significado: 'Modelo de privacidade por agregação', descricao: 'Técnica que exige um número mínimo (k) de registros indistinguíveis em qualquer recorte. CompSmart usa k=5 — nenhum dado psicossocial é exibido para grupos com menos de 5 respondentes.' },
];

// ============ PRIVACIDADE & LGPD ============
type PrivacidadeItem = { titulo: string; texto: string; baseLegal?: string };
type PrivacidadeBloco = {
  id: string;
  titulo: string;
  resumo: string;
  itens: PrivacidadeItem[];
};

const PRIVACIDADE_BLOCOS: PrivacidadeBloco[] = [
  {
    id: 'anonimato',
    titulo: 'A · Anonimato por Padrão',
    resumo:
      'Toda resposta de diagnóstico nasce anônima. Não existe caminho técnico para reidentificar um respondente individual.',
    itens: [
      {
        titulo: 'Hash irreversível, sem identificadores',
        texto:
          'A tabela nr1_diagnostico_respostas guarda apenas um respondent_hash (SHA-256 de user_id + diagnóstico). Não existem colunas user_id, e-mail, CPF, nome ou cargo nessa tabela. Auditado em CI pelo teste nr1-anonimato-consentimento.',
        baseLegal: 'LGPD Art. 12 (anonimização) — dado anonimizado não é dado pessoal.',
      },
      {
        titulo: 'Nem o super-admin reabre uma resposta',
        texto:
          'A regra é estrutural, não de policy: como não há FK para o usuário, não existe consulta SQL que reconstrua "quem respondeu o quê". Apenas o próprio colaborador, no seu navegador, conhece seu hash durante o ciclo.',
      },
      {
        titulo: 'k-anonimato ≥ 5 respondentes',
        texto:
          'Nenhum recorte (área, equipe, gestor, modalidade) é exibido com menos de 5 respondentes. Abaixo desse limiar o sistema mostra "amostra insuficiente" para evitar reidentificação por inferência.',
        baseLegal: 'Sweeney (2002) — k-anonymity como modelo de proteção.',
      },
      {
        titulo: 'Instrumentos cobertos',
        texto:
          'Quick Screening (subset DASS-21, 5–7 itens) e Diagnóstico Completo (COPSOQ-III, 6 dimensões / ~40 itens) são SEMPRE anônimos. Subset não equivale a diagnóstico clínico — apenas sinaliza necessidade de aprofundamento.',
      },
    ],
  },
  {
    id: 'consentimento',
    titulo: 'B · Consentimento Explícito (LGPD)',
    resumo:
      'O acesso ao módulo é bloqueado até o colaborador aceitar 3 cláusulas, com versionamento e direito de revogação a qualquer tempo.',
    itens: [
      {
        titulo: 'Três aceites obrigatórios',
        texto:
          'No primeiro acesso, o gate exibe um diálogo modal não-dispensável com 3 checkboxes independentes: (1) uso das respostas para diagnóstico NR-1, (2) ciência de que serão tratadas de forma anônima e agregada, (3) ciência do direito de revogação. O botão "Aceitar e continuar" só habilita com os três marcados.',
        baseLegal: 'LGPD Art. 7º V e Art. 8º §1º — consentimento livre, informado e inequívoco.',
      },
      {
        titulo: 'Versionamento do termo',
        texto:
          'O termo aceito é gravado em profiles.nr1_consent_at + nr1_consent_version. Quando publicamos uma nova versão, o gate é exibido novamente para reaceite — o consentimento antigo não vale para o termo novo.',
      },
      {
        titulo: 'Reconfirmação por ciclo',
        texto:
          'Antes de cada novo questionário, exibimos uma reconfirmação leve (Nr1ConsentReconfirm) reafirmando anonimato e direito de pausar. O ciclo só inicia após o aceite.',
      },
      {
        titulo: 'Recusa não tem impacto',
        texto:
          'Recusar o consentimento não afeta vínculo empregatício, avaliação de desempenho, remuneração ou qualquer outro processo. O colaborador volta para o dashboard padrão.',
        baseLegal: 'LGPD Art. 8º §5º — direito de revogação a qualquer tempo, sem ônus.',
      },
    ],
  },
  {
    id: 'cruzamento',
    titulo: 'C · Cruzamento com Liderança Direta & RH',
    resumo:
      'Antes do consentimento de identificação, RH e gestor só veem agregados. Depois, regras estritas para flags identificadas.',
    itens: [
      {
        titulo: 'Antes do consentimento de identificação',
        texto:
          'Dados sobre o líder direto só podem ser cruzados em base agregada por área/equipe (mín. 5 respondentes). O dashboard RH nunca exibe linhas individuais — apenas scores por dimensão COPSOQ-III, distribuição de risco e total de respondentes.',
      },
      {
        titulo: 'Depois do consentimento (passo 7 do fluxo)',
        texto:
          'O colaborador pode optar por vincular o plano de ação ao seu nome para receber acompanhamento personalizado. Só nesse momento o agente Bem-Estar pode gerar flag identificado para RH/SESMT, e ainda assim limitado ao escopo do plano consentido.',
      },
      {
        titulo: 'Protocolo de risco crítico',
        texto:
          'Se o agente identificar ideação suicida, autolesão, crise de pânico aguda, sintomas psicóticos ou ameaça a si/terceiros, ele acolhe sem julgar e encaminha imediatamente para CVV 188, SAMU 192 ou pronto-socorro — independentemente de consentimento. Flag ao RH só é gerado se houver consentimento prévio; do contrário, o próprio colaborador é orientado a buscar ajuda.',
      },
      {
        titulo: 'Vedações ao agente',
        texto:
          'O agente Bem-Estar nunca solicita CPF, endereço residencial, dados de saúde de familiares ou qualquer informação não essencial ao escopo psicossocial ocupacional. Também nunca dá diagnóstico clínico individual — sempre encaminha ao SESMT, médico do trabalho ou EAP.',
      },
    ],
  },
  {
    id: 'direitos',
    titulo: 'D · Direitos do Titular & Encerramento',
    resumo:
      'O colaborador é dono dos próprios dados e pode pausar, encerrar ou solicitar exclusão a qualquer momento.',
    itens: [
      {
        titulo: 'Direito ao encerramento antecipado',
        texto:
          'O ciclo padrão de acompanhamento é de 12 semanas, mas o colaborador pode pausar, encerrar ou solicitar exclusão dos dados a qualquer momento. Lembramos essa opção em todo check-in semanal.',
        baseLegal: 'LGPD Art. 18 — direitos do titular.',
      },
      {
        titulo: 'Revisão de consentimento',
        texto:
          'O colaborador pode revisar o termo aceito e revogar em "Meu Perfil" ou na página de Consentimento NR-1. Revogação encerra ciclos em andamento e bloqueia novos questionários.',
      },
      {
        titulo: 'Canal com o DPO',
        texto:
          'Solicitações formais (acesso, correção, anonimização adicional, portabilidade, exclusão) devem ser encaminhadas ao Encarregado de Dados (DPO) da empresa contratante. CompSmart atua como operador (Art. 39 LGPD).',
      },
      {
        titulo: 'Validação contínua',
        texto:
          'Estas regras são verificadas a cada build pelo conjunto de testes nr1-anonimato-consentimento.test.ts (vitest), que falha o pipeline se qualquer cláusula desta página deixar de ser refletida no código.',
      },
    ],
  },
];

// ============ BIBLIOTECA ============
type LinkExterno = { url: string; label: string };
type Livro = {
  titulo: string;
  autor: string;
  ano: number;
  categoria: 'Saúde Mental' | 'Liderança' | 'Cultura' | 'Performance' | 'Direito' | 'Metodologia';
  resumoCurto: string;
  resumoCompleto: string;
  linkPrincipal?: LinkExterno;
  linkCompra?: LinkExterno;
};

const LIVROS: Livro[] = [
  {
    titulo: 'Por Que Fazemos o Que Fazemos',
    autor: 'Mario Sergio Cortella',
    ano: 2016,
    categoria: 'Cultura',
    resumoCurto: 'Reflexões sobre propósito, ética e sentido no trabalho. Leitura essencial para líderes que querem construir ambientes psicologicamente saudáveis e organizações com vitalidade duradoura.',
    resumoCompleto: `Mario Sergio Cortella, filósofo e educador brasileiro, organiza o livro em torno de uma pergunta provocativa: por que fazemos o que fazemos no trabalho e na vida? A obra é estruturada em capítulos curtos e conversacionais que abordam propósito, ética, motivação, sentido e a relação entre empresa e indivíduo.

A tese central é que trabalho sem sentido adoece — argumento diretamente alinhado ao que a NR-1 chama hoje de risco psicossocial. Cortella diferencia "ocupação" (preencher o tempo), "emprego" (vínculo formal), "trabalho" (esforço produtivo) e "obra" (algo que deixamos no mundo). Pessoas que enxergam suas atividades apenas como ocupação ou emprego tendem a sofrer mais com sobrecarga, falta de reconhecimento e baixo controle — exatamente os fatores de risco mapeados pelo COPSOQ-III.

Outros temas centrais: a diferença entre "carreira" e "trajetória"; ética como prática cotidiana e não como discurso; a armadilha da meritocracia desacompanhada de oportunidades reais; e o papel do líder como construtor de contexto, não apenas cobrador de resultado.

**Aplicação no CompSmart:** este livro é referência para o pilar "Cultura & Sentido" do FIB (Felicidade Interna Bruta) e para a justificativa qualitativa dos programas de Reconhecimento. Líderes que leem Cortella tendem a estruturar 1:1s com perguntas de propósito, e não apenas de tarefa — reduzindo o fator de risco "Baixas recompensas e reconhecimento".`,
    linkPrincipal: { url: 'https://www.companhiadasletras.com.br/autor/22091/mario-sergio-cortella', label: 'Página do autor (editora)' },
    linkCompra: { url: 'https://www.amazon.com.br/Por-Fazemos-Que-Fazemos-Cortella/dp/8551302035', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'A Coragem de Ser Imperfeito',
    autor: 'Brené Brown',
    ano: 2013,
    categoria: 'Saúde Mental',
    resumoCurto: 'Brown revela como a vulnerabilidade — e não a perfeição — é a base da conexão humana e da segurança psicológica. Fundamental para entender o ISP em equipes.',
    resumoCompleto: `Brené Brown, pesquisadora da Universidade de Houston, sintetiza mais de uma década de pesquisa qualitativa sobre vergonha, vulnerabilidade e coragem. O livro original "Daring Greatly" parte do conceito de que a vulnerabilidade — capacidade de se expor sem garantia de retorno — é o berço da inovação, da criatividade e da confiança no trabalho.

A autora demonstra, com dados de mais de 12 mil entrevistas, que ambientes que punem o erro produzem profissionais que escondem problemas, evitam feedback e param de sugerir ideias. Esse comportamento é hoje a definição operacional de baixa segurança psicológica — exatamente o construto que Amy Edmondson formalizou na pesquisa do Google (Project Aristotle).

Capítulos-chave: (1) "A escassez nunca é suficiente" — como a cultura do "nunca o bastante" gera burnout; (2) "Desfazendo mitos da vulnerabilidade" — vulnerabilidade não é fraqueza nem oversharing; (3) "Cheque sua armadura" — quais defesas líderes usam para evitar conexão (perfeccionismo, cinismo, controle); (4) "Liderança ousada" — como dar feedback duro com cuidado.

**Aplicação no CompSmart:** referência direta para o ISP (Índice de Segurança Psicológica) calculado na dimensão "Relações e Liderança" do questionário NR-1. Recomendamos para gestores que lideram equipes com baixo eNPS ou alta rotatividade voluntária, pois aborda diretamente os fatores de risco "Falta de suporte", "Baixa justiça organizacional" e "Maus relacionamentos".`,
    linkPrincipal: { url: 'https://brenebrown.com/book/daring-greatly/', label: 'Site oficial da autora' },
    linkCompra: { url: 'https://www.amazon.com.br/coragem-ser-imperfeito-Bren%C3%A9-Brown/dp/8543108683', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'The Fearless Organization',
    autor: 'Amy C. Edmondson',
    ano: 2018,
    categoria: 'Liderança',
    resumoCurto: 'A criadora do conceito de Segurança Psicológica mostra como construir times que falam, erram e aprendem sem medo. Base teórica do nosso ISP.',
    resumoCompleto: `Amy Edmondson, professora de Harvard Business School, é a pesquisadora que cunhou o termo "psychological safety" em 1999. Este livro consolida 25 anos de pesquisa em hospitais, fábricas, escritórios e equipes de software, definindo segurança psicológica como "a crença compartilhada de que o time é seguro para tomar riscos interpessoais — falar, discordar, admitir erro, fazer perguntas".

A obra desmonta três mitos: (1) segurança psicológica não é "ser legal" — equipes seguras debatem com mais intensidade, não menos; (2) não é sinônimo de baixa exigência — a matriz 2x2 de Edmondson cruza segurança com padrões de performance, e o quadrante ideal é "alto/alto" (zona de aprendizado); (3) não é responsabilidade exclusiva do RH — é construída no comportamento diário do líder direto.

A segunda parte traz casos concretos: a Pixar e a "braintrust", a Volkswagen e o escândalo do diesel (caso clássico de baixa segurança levando a fraude), Barry-Wehmiller e a liderança que pergunta. Edmondson propõe um framework de 3 passos para o líder: enquadrar o trabalho como aprendizado, convidar a participação genuinamente, e responder produtivamente quando alguém fala (sem matar o mensageiro).

**Aplicação no CompSmart:** este é o livro-base do ISP. As 7 perguntas da dimensão "Relações e Liderança" do questionário NR-1 derivam diretamente da escala de 7 itens de Edmondson, validada e adaptada para o português. Líderes com ISP baixo recebem este livro como leitura prioritária no PDI.`,
    linkPrincipal: { url: 'https://fearlessorganization.com/the-fearless-organization', label: 'Site oficial do livro' },
    linkCompra: { url: 'https://www.amazon.com.br/Fearless-Organization-Psychological-Workplace-Innovation/dp/1119477247', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'Burnout: O Segredo para Romper o Ciclo do Estresse',
    autor: 'Emily & Amelia Nagoski',
    ano: 2020,
    categoria: 'Saúde Mental',
    resumoCurto: 'As autoras explicam a diferença entre estresse e estressor, e como completar o ciclo do estresse para evitar o burnout. Leitura essencial para o Programa de Bem-Estar.',
    resumoCompleto: `As irmãs Nagoski — Emily, PhD em educação sexual com formação em saúde, e Amelia, regente de coral e DMA — combinam neurociência, fisiologia e experiência clínica para explicar por que o burnout atinge desproporcionalmente as mulheres e por que descansar "no fim de semana" não resolve.

Conceito central: existe diferença entre o **estressor** (a situação que gera estresse — o chefe difícil, a planilha, o engarrafamento) e o **estresse** (a resposta fisiológica do corpo: cortisol, adrenalina, tensão muscular). Eliminar o estressor não elimina o estresse já acumulado no corpo. Para fechar o ciclo, é preciso ação física: exercício (20–60 min é o mais eficaz), respiração profunda, interação social positiva, riso genuíno, afeto, choro ou expressão criativa.

A segunda tese é a "Síndrome do Doador Humano" (Human Giver Syndrome): a expectativa cultural de que mulheres existem para servir o conforto dos outros, sem direito a necessidades próprias. Essa pressão se reproduz no ambiente corporativo via sobrecarga emocional invisível, e está ligada estatisticamente a maiores taxas de burnout em líderes mulheres.

Capítulos práticos cobrem: como identificar os 3 sinais clínicos do burnout (exaustão, despersonalização, queda de eficácia — Maslach), como negociar com o "monitor interno" que diz para você continuar mesmo exausta, e como construir um "bubble of love" — rede de apoio mínima para sustentação.

**Aplicação no CompSmart:** base do agente "Bem-Estar" e dos planos de ação para colaboradores com FIB baixo na dimensão Saúde. Também sustenta a recomendação de pausas ativas e a campanha de não-resposta a e-mails fora do expediente.`,
    linkPrincipal: { url: 'https://www.burnoutbook.net/', label: 'Site oficial das autoras' },
    linkCompra: { url: 'https://www.amazon.com.br/Burnout-segredo-romper-ciclo-estresse/dp/8543109965', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'Drive — A Surpreendente Verdade Sobre o Que Nos Motiva',
    autor: 'Daniel H. Pink',
    ano: 2009,
    categoria: 'Performance',
    resumoCurto: 'Pink demonstra que autonomia, propósito e domínio motivam mais do que recompensas externas. Insight fundamental para conectar Remuneração ↔ Saúde Mental.',
    resumoCompleto: `Daniel Pink revisa 50 anos de pesquisa em psicologia da motivação (Deci, Ryan, Csikszentmihalyi, Amabile) e mostra que o modelo "cenoura e chicote" — bônus por meta, punição por erro — funciona apenas em tarefas mecânicas e repetitivas. Para qualquer trabalho que exija criatividade, julgamento ou resolução de problemas (ou seja, praticamente todo trabalho de conhecimento), recompensas extrínsecas pioram a performance.

O experimento mais famoso citado é o de Glucksberg (1962) com o "problema da vela": grupos sob pressão de recompensa demoraram 3,5 minutos a mais para resolver o desafio do que grupos sem pressão. Quando o problema foi simplificado para tarefa mecânica, a recompensa acelerou — confirmando que dinheiro funciona como motivador apenas em tarefas algorítmicas.

A alternativa (Motivação 3.0) tem três pilares: **Autonomia** (sobre tarefa, tempo, técnica e time), **Domínio** (a busca contínua de melhorar em algo que importa) e **Propósito** (sentir que o trabalho serve a algo maior que o lucro trimestral). Empresas como Atlassian (FedEx Days), 3M (15% de tempo livre) e a antiga Google (20% de tempo) são citadas como casos onde autonomia produziu mais inovação do que campanhas de bônus.

Pink também critica o "if-then reward" (se você fizer X, então ganha Y), mostrando que ele estreita o foco, suprime criatividade e estimula trapaça (caso Wells Fargo, Volkswagen, Enron).

**Aplicação no CompSmart:** este livro é o argumento por trás do equilíbrio "Total Cash + Total Compensation + reconhecimento não-monetário". Sustenta a recomendação de que metas de bônus não devem cobrir mais de 30% da remuneração-alvo de funções criativas, e justifica o investimento em programas de reconhecimento.`,
    linkPrincipal: { url: 'https://www.danpink.com/books/drive/', label: 'Site oficial do autor' },
    linkCompra: { url: 'https://www.amazon.com.br/Motiva%C3%A7%C3%A3o-3-0-Daniel-H-Pink/dp/8539004917', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'Florescer (Flourish)',
    autor: 'Martin E. P. Seligman',
    ano: 2011,
    categoria: 'Saúde Mental',
    resumoCurto: 'O pai da Psicologia Positiva apresenta o modelo PERMA (Positive emotion, Engagement, Relationships, Meaning, Accomplishment) — base do nosso FIB.',
    resumoCompleto: `Martin Seligman, ex-presidente da American Psychological Association e fundador da Psicologia Positiva, apresenta neste livro a evolução de sua teoria. Em 2002 (Felicidade Autêntica), ele havia proposto que felicidade era composta de prazer + engajamento + sentido. Aqui, ele atualiza o modelo para PERMA, com cinco elementos mensuráveis e independentes:

**P – Positive Emotion** (emoções positivas): alegria, gratidão, esperança. Medíveis e cultiváveis com práticas como o exercício "três coisas boas" antes de dormir.
**E – Engagement** (engajamento / flow): estado descrito por Csikszentmihalyi de imersão total na tarefa, em que tempo desaparece. Surge quando habilidade e desafio estão equilibrados.
**R – Relationships** (relacionamentos): "outras pessoas são o melhor antídoto para os pioras da vida". Conexões profundas explicam mais variância em bem-estar do que renda.
**M – Meaning** (significado): pertencer e servir a algo maior que si.
**A – Accomplishment** (realização): perseguir maestria por si só, não pelo prêmio.

A segunda parte do livro descreve o programa do Exército dos EUA (Comprehensive Soldier Fitness), em que 1,1 milhão de soldados foram treinados em PERMA para reduzir TEPT — primeiro experimento em larga escala de bem-estar como prevenção. Também inclui o programa de Geelong Grammar (Austrália), pioneiro em educação positiva.

Crítica importante de Seligman: bem-estar não é "ausência de doença mental". As duas dimensões são independentes — alguém pode estar sem depressão e ainda assim "languido" (Adam Grant, 2021).

**Aplicação no CompSmart:** o FIB (Felicidade Interna Bruta) é estruturado nos cinco eixos do PERMA, traduzidos para o contexto corporativo. Cada dimensão tem perguntas específicas no ciclo de check-in trimestral.`,
    linkPrincipal: { url: 'https://ppc.sas.upenn.edu/people/martin-ep-seligman', label: 'Página acadêmica do autor' },
    linkCompra: { url: 'https://www.amazon.com.br/Florescer-Compreens%C3%A3o-cient%C3%ADfica-felicidade-bem-estar/dp/8580631688', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'Mindset: A Nova Psicologia do Sucesso',
    autor: 'Carol S. Dweck',
    ano: 2017,
    categoria: 'Performance',
    resumoCurto: 'Dweck contrasta mentalidade fixa vs. crescimento. Aplica-se diretamente ao PDI, sucessão e cultura de aprendizagem segura.',
    resumoCompleto: `Carol Dweck, professora de Stanford, publicou em 2006 (com revisão em 2017) a síntese de 30 anos de pesquisa sobre como crenças sobre inteligência e talento moldam comportamento. A distinção central:

**Mindset Fixo:** crença de que inteligência e talento são traços fixos. Quem tem essa mentalidade tende a evitar desafios (porque erros expõem "falta de talento"), desistir diante de obstáculos, ver esforço como sinal de incompetência, ignorar críticas úteis e sentir-se ameaçado pelo sucesso alheio.

**Mindset de Crescimento:** crença de que habilidades são desenvolvíveis com prática, estratégia e feedback. Pessoas com essa mentalidade buscam desafios, persistem, valorizam esforço como caminho da maestria, aprendem com críticas e se inspiram (não se ameaçam) com o sucesso dos outros.

A pesquisa empírica é robusta: estudantes ensinados sobre neuroplasticidade melhoram notas; atletas que veem treino como aprendizado superam os que veem como prova de talento (Michael Jordan é o caso clássico — cortado do time do colégio); e ambientes corporativos que celebram aprendizado, não apenas resultado, geram mais inovação.

Dweck também alerta sobre o "False Growth Mindset": empresas que dizem ter cultura de crescimento mas demitem após o primeiro fracasso, ou líderes que elogiam esforço de criança que falhou (sem mostrar caminho de melhoria). Mindset de crescimento não é positividade vazia — exige feedback honesto e estratégia de melhoria.

Capítulo crítico: como pais, professores e líderes formam mindset com a linguagem do elogio. Elogiar processo ("você tentou várias estratégias") gera crescimento; elogiar traço ("você é tão inteligente") gera fixo.

**Aplicação no CompSmart:** sustenta a metodologia do PDI (Plano de Desenvolvimento Individual) e o template de avaliação 9-Box, em que o eixo "potencial" é tratado como desenvolvível, não inato. Também guia a redação de feedback nas avaliações 360.`,
    linkPrincipal: { url: 'https://profiles.stanford.edu/carol-dweck', label: 'Página acadêmica da autora' },
    linkCompra: { url: 'https://www.amazon.com.br/Mindset-nova-psicologia-sucesso-Carol/dp/8547000267', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'Lost Connections',
    autor: 'Johann Hari',
    ano: 2018,
    categoria: 'Saúde Mental',
    resumoCurto: 'Hari investiga as causas sociais e organizacionais da depressão e ansiedade modernas, com forte crítica ao isolamento no trabalho. Essencial para entender riscos psicossociais.',
    resumoCompleto: `Johann Hari, jornalista britânico, viajou por três continentes entrevistando neurocientistas, psiquiatras e antropólogos para responder por que a depressão explodiu em sociedades ricas. A tese central é polêmica e respaldada por meta-análises: o modelo "depressão = desequilíbrio químico" explica menos do que se diz (e foi parcialmente refutado pela própria FDA). A depressão e ansiedade modernas são, em grande parte, **respostas saudáveis a vidas insalubres**.

Hari sistematiza nove causas das "conexões perdidas":
1. Desconexão do trabalho com sentido (Gallup: apenas 13% dos trabalhadores no mundo se sentem engajados)
2. Desconexão de outras pessoas (epidemia de solidão)
3. Desconexão de valores significativos (cultura materialista)
4. Desconexão de trauma da infância (estudos ACE)
5. Desconexão de status e respeito (hierarquias rígidas)
6. Desconexão do mundo natural
7. Desconexão de futuro esperançoso (precariedade)
8. Causas genuinamente biológicas e genéticas (real, mas menor do que vendido)
9. Desconexão de poder e controle sobre o próprio trabalho

A causa #9 é especialmente relevante para a NR-1: o estudo de Whitehall (Marmot, funcionalismo público britânico) mostrou que servidores com baixo controle sobre o trabalho tinham 2x mais infartos e depressão do que executivos seniores — independentemente de salário, tabagismo ou genética. Baixo controle no trabalho é hoje fator de risco psicossocial reconhecido pela OMS.

A última parte propõe "reconexões": renda básica como antidepressivo, cooperativas de trabalho como vacina contra depressão (caso Baltimore Bicycle Works), e a recuperação do tempo de não-trabalho.

**Aplicação no CompSmart:** referência para a justificativa qualitativa do fator de risco "Baixo controle no trabalho / Falta de autonomia" do COPSOQ-III e para o desenho de planos de ação que devolvem decisão à equipe.`,
    linkPrincipal: { url: 'https://thelostconnections.com/', label: 'Site oficial do livro' },
    linkCompra: { url: 'https://www.amazon.com.br/Lost-Connections-Uncovering-Depression-Unexpected/dp/1408878690', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'A Mente Vencedora — Cuidando da Saúde Mental no Trabalho',
    autor: 'Ana Beatriz Barbosa Silva',
    ano: 2019,
    categoria: 'Saúde Mental',
    resumoCurto: 'Psiquiatra brasileira referência em saúde mental no trabalho aborda burnout, ansiedade e estratégias práticas de autocuidado em ambientes corporativos exigentes.',
    resumoCompleto: `Ana Beatriz Barbosa Silva é psiquiatra brasileira e uma das principais comunicadoras públicas sobre saúde mental no país. Sua obra ("Mentes Ansiosas", "Mentes Inquietas", "Mentes & Manias", entre outras) traz para o contexto brasileiro a pesquisa internacional sobre transtornos mentais comuns no trabalho, com casos clínicos reais do consultório.

Os temas centrais relevantes ao CompSmart: (1) **Síndrome do Pensamento Acelerado (SPA)** — quadro descrito pela autora como hiperatividade mental crônica, alimentada por excesso de estímulos digitais e jornadas sem pausa, antessala do burnout; (2) **Ansiedade generalizada no ambiente corporativo** — diferenciação clínica entre preocupação saudável e TAG; (3) **Diferença entre tristeza, depressão e burnout** — três quadros frequentemente confundidos por gestores; (4) **Estratégias práticas de autocuidado** que cabem na rotina: higiene do sono, jejum digital, exercícios de respiração, supervisão da rede social mínima.

A autora também aborda o papel da família e da empresa como suporte. Ressalta que sintomas como irritabilidade, esquecimentos, atrasos e queda de produtividade muitas vezes são interpretados como "problema de atitude" pelo gestor, quando são sinais clínicos. Defende treinamento de líderes para reconhecer sinais precoces — exatamente o que a NR-1 passa a exigir como ação preventiva.

Texto acessível, com vocabulário sem jargão médico, escrito para o público leigo. É hoje uma das obras mais usadas em treinamentos corporativos brasileiros sobre saúde mental.

**Aplicação no CompSmart:** referência brasileira para o programa Bem-Estar e para o conteúdo de microlearning enviado a líderes via agente de comunicação. Adapta conceitos internacionais à realidade jurídica e cultural do Brasil.`,
    linkPrincipal: { url: 'https://draanabeatrizbsilva.com.br/', label: 'Site oficial da autora' },
    linkCompra: { url: 'https://www.amazon.com.br/s?k=Ana+Beatriz+Barbosa+Silva&i=stripbooks', label: 'Ver livros da autora na Amazon' },
  },
  {
    titulo: 'Manual de Saúde Mental no Trabalho',
    autor: 'Duílio Antero de Camargo',
    ano: 2021,
    categoria: 'Direito',
    resumoCurto: 'Obra técnica que conecta legislação trabalhista, NR-1, CID-11 e práticas de prevenção. Referência para a área de SST e RH na adequação à NR-1.',
    resumoCompleto: `Duílio Antero de Camargo é médico psiquiatra, perito judicial e professor com décadas de atuação na interface entre saúde mental, medicina do trabalho e Direito. O Manual é organizado como obra de referência técnico-jurídica para profissionais de SESMT, RH, jurídico trabalhista e perícia.

A primeira parte cobre **fundamentos clínicos**: classificação CID-10/CID-11 dos transtornos mentais e comportamentais, com foco nos quadros relacionados ao trabalho (F32 depressão, F41 ansiedade, F43 reações ao estresse grave, Z73 burnout pré-CID-11, e a entrada de **QD85 burnout** na CID-11 a partir de 2022). Para cada quadro, traz critérios diagnósticos, diagnóstico diferencial e prognóstico ocupacional.

A segunda parte é **jurídica**: análise da CLT (art. 157, 158), das NRs (com foco em NR-1, NR-7 e NR-17), da Lei 8.213/91 (acidentes e nexo técnico epidemiológico — NTEP), súmulas do TST sobre dano existencial, assédio moral e reparação por adoecimento mental. Discute o conceito de "doença ocupacional equiparada" e o papel da CAT (Comunicação de Acidente do Trabalho) em transtornos mentais.

A terceira parte é **prática**: como conduzir o exame médico ocupacional (admissional, periódico, demissional) frente a riscos psicossociais; como elaborar o PCMSO atualizado com NR-1; como o RH deve construir trilha de cuidado (acolhimento → encaminhamento → afastamento → retorno → readaptação).

A quarta parte traz **modelos documentais**: termo de acolhimento, ficha de avaliação de risco psicossocial, comunicação interna, política de saúde mental — todos prontos para customização.

**Aplicação no CompSmart:** principal referência jurídica do módulo NR-1. Os relatórios de evidência documental gerados pela plataforma seguem a estrutura do Manual para garantir aderência em fiscalização do MTE e em eventual perícia trabalhista.`,
    linkPrincipal: { url: 'https://www.grupogen.com.br/livro-manual-de-saude-mental-no-trabalho-duilio-camargo', label: 'Página da editora (Grupo GEN)' },
    linkCompra: { url: 'https://www.amazon.com.br/s?k=Du%C3%ADlio+Antero+Camargo+sa%C3%BAde+mental&i=stripbooks', label: 'Buscar na Amazon' },
  },
  {
    titulo: 'Reinventando as Organizações',
    autor: 'Frederic Laloux',
    ano: 2014,
    categoria: 'Cultura',
    resumoCurto: 'Laloux apresenta organizações Teal — autogestionadas, com propósito evolutivo e plenitude. Modelo inspirador para empresas que querem ir além da conformidade NR-1.',
    resumoCompleto: `Frederic Laloux, ex-consultor da McKinsey, estudou em profundidade 12 organizações pioneiras (Buurtzorg, Patagonia, Morning Star, FAVI, Sun Hydraulics, AES, Heiligenfeld, entre outras) e codificou o que chama de paradigma organizacional **Teal** (verde-azulado), o quinto estágio na evolução dos modelos de gestão.

Os estágios anteriores: **Vermelho** (chefe alpha, impulso, gangues e máfias), **Âmbar** (hierarquia, igreja, exército, escola tradicional), **Laranja** (meritocracia, KPIs, multinacional moderna), **Verde** (cultura, valores, stakeholders, B-Corps). Cada estágio resolveu um problema do anterior mas criou novos limites.

**Teal** é caracterizado por três avanços: (1) **Autogestão** — fim da pirâmide tradicional, decisões tomadas por quem está mais perto do problema usando o "advice process" (consultar especialistas e afetados, decidir, comunicar); (2) **Plenitude (wholeness)** — ambientes que convidam o profissional a trazer o ser humano completo ao trabalho, e não apenas a "máscara profissional"; (3) **Propósito evolutivo** — a organização tem um propósito que evolui, sentido por quem trabalha nela como vocação, não como missão imposta de cima.

Casos detalhados: **Buurtzorg** (enfermagem domiciliar holandesa, 14 mil enfermeiras em equipes autogeridas de 12, com 40% menos custo que concorrentes tradicionais e maior satisfação do paciente); **Morning Star** (maior processadora de tomate dos EUA, sem chefes, com CLOUs — Colleague Letter of Understanding); **Patagonia** (políticas de bem-estar pioneiras, como creche corporativa e licenças generosas).

Crítica e contraponto: a literatura posterior (incluindo casos de empresas que tentaram migrar para Teal e falharam) mostra que o modelo exige maturidade cultural prévia. Não é receita pronta.

**Aplicação no CompSmart:** referência aspiracional para empresas que, depois de cumprir NR-1, querem evoluir para modelos genuinamente saudáveis — não apenas evitar adoecimento. Sustenta o conceito de "empresa vital" no FIB nível 5.`,
    linkPrincipal: { url: 'https://www.reinventingorganizations.com/', label: 'Site oficial do autor' },
    linkCompra: { url: 'https://www.amazon.com.br/Reinventando-organiza%C3%A7%C3%B5es-Frederic-Laloux/dp/8568014046', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'Liderança: A Inteligência Emocional na Formação do Líder de Sucesso',
    autor: 'Daniel Goleman',
    ano: 2015,
    categoria: 'Liderança',
    resumoCurto: 'Goleman compila décadas de pesquisa sobre como inteligência emocional do líder afeta diretamente o clima e a saúde mental da equipe.',
    resumoCompleto: `Daniel Goleman, psicólogo e jornalista científico que popularizou o conceito de Inteligência Emocional (IE) em 1995, reúne neste volume seus principais artigos da Harvard Business Review sobre liderança. A tese central, sustentada por pesquisa em mais de 3 mil executivos: **a IE explica até 90% da diferença entre líderes excepcionais e medianos** em cargos seniores — mais do que QI ou competência técnica.

Goleman estrutura a IE em quatro domínios e doze competências:
- **Autoconsciência:** consciência emocional, autoavaliação precisa, autoconfiança.
- **Autogestão:** autocontrole emocional, adaptabilidade, orientação para resultado, perspectiva positiva.
- **Consciência social:** empatia, consciência organizacional.
- **Gestão de relacionamentos:** influência, mentoria, gestão de conflitos, trabalho em equipe, liderança inspiradora.

A pesquisa de Hay/McBer com 3.871 executivos identificou **seis estilos de liderança** e seu impacto no clima organizacional: (1) Coercitivo — "faça o que eu mando", impacto negativo; (2) Diretivo / Visionário — "venham comigo", impacto muito positivo; (3) Afetivo — "as pessoas vêm primeiro", positivo; (4) Democrático — "o que vocês acham?", positivo; (5) Modelador — "faça como eu, agora", negativo se único; (6) Coach — "tente isto", muito positivo.

Goleman demonstra que líderes excepcionais usam ao menos quatro estilos com fluidez, alternando conforme o contexto. Líderes medíocres dominam um só (geralmente Coercitivo ou Modelador) e o aplicam em todas as situações.

A obra também aborda o conceito de "ressonância" — líderes ressonantes sintonizam com o estado emocional da equipe e elevam o clima; líderes dissonantes contaminam negativamente. O clima emocional do líder direto é o **maior preditor de engajamento** — mais do que cultura corporativa global.

**Aplicação no CompSmart:** sustenta o módulo de Avaliação 360 e o feedback dado a líderes com baixo eNPS de equipe. As perguntas sobre estilo de liderança no questionário NR-1 derivam dos seis estilos de Goleman.`,
    linkPrincipal: { url: 'https://www.danielgoleman.info/', label: 'Site oficial do autor' },
    linkCompra: { url: 'https://www.amazon.com.br/Lideran%C3%A7a-intelig%C3%AAncia-emocional-forma%C3%A7%C3%A3o-sucesso/dp/8539006359', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'O Poder do Hábito',
    autor: 'Charles Duhigg',
    ano: 2012,
    categoria: 'Performance',
    resumoCurto: 'Duhigg explica como hábitos individuais e organizacionais se formam — base para criar rituais de check-in de vitalidade e cultura de cuidado.',
    resumoCompleto: `Charles Duhigg, jornalista vencedor do Pulitzer pelo New York Times, sintetiza a neurociência dos hábitos com base em pesquisas do MIT, da Duke e da Universidade da Califórnia. A descoberta central: ~40% das ações diárias não são decisões, mas hábitos — comportamentos automáticos disparados por gatilhos contextuais, executados sem deliberação consciente.

Todo hábito segue o **loop neural em três partes**: (1) **deixa** (cue) — gatilho ambiental que ativa o cérebro a entrar em modo automático; (2) **rotina** (routine) — comportamento físico, mental ou emocional executado; (3) **recompensa** (reward) — sinal que ensina o cérebro se vale a pena guardar o loop. Com repetição, surge a **fissura** (craving) — desejo antecipado da recompensa, que torna o hábito difícil de quebrar.

A "Regra de Ouro da Mudança de Hábito": não é possível extinguir um hábito enraizado, mas é possível **trocar a rotina** mantendo deixa e recompensa. Caso clássico: alcoólicos anônimos não eliminam a deixa (estresse) nem a recompensa (alívio social), trocam apenas a rotina (em vez de beber, vão à reunião).

A segunda parte aborda **hábitos organizacionais**. Caso da Alcoa sob Paul O'Neill: ao escolher um único "hábito-chave" — segurança do trabalhador — o CEO reformulou comunicação, processos e cultura, e a empresa quintuplicou de valor. Hábitos-chave (keystone habits) têm efeito cascata sobre outros comportamentos.

A terceira parte cobre **hábitos sociais**: como o boicote dos ônibus de Montgomery e a igreja de Saddleback usaram a mesma engenharia de hábitos para mobilizar milhões.

**Aplicação no CompSmart:** sustenta o desenho dos rituais semanais (check-in de vitalidade, 1:1 estruturado, retrospectiva de equipe). Também justifica a estratégia de **micro-hábitos** nos planos de ação NR-1 — em vez de pedir transformação cultural ampla, identificamos um hábito-chave por equipe e instrumentamos o loop completo.`,
    linkPrincipal: { url: 'https://charlesduhigg.com/the-power-of-habit/', label: 'Site oficial do autor' },
    linkCompra: { url: 'https://www.amazon.com.br/Poder-h%C3%A1bito-Charles-Duhigg/dp/8539004119', label: 'Comprar na Amazon' },
  },
  {
    titulo: 'NR-1 Comentada — Riscos Psicossociais',
    autor: 'Equipe técnica MTE / referências consolidadas',
    ano: 2025,
    categoria: 'Direito',
    resumoCurto: 'Análise artigo por artigo da NR-1 atualizada pela Portaria MTE 1.419/2024, com foco em conformidade, evidências documentais e defesa em fiscalização.',
    resumoCompleto: `**Nota:** este conteúdo é uma síntese técnica preparada pela equipe CompSmart a partir da legislação oficial e de obras de comentário em circulação no mercado jurídico brasileiro em 2025. Não há, até o momento, uma única obra-livro consolidada de domínio público sobre a NR-1 atualizada — recomendamos sempre consultar a Portaria MTE 1.419/2024 diretamente no site do governo.

**Contexto histórico.** A NR-1 (Disposições Gerais e Gerenciamento de Riscos Ocupacionais) foi a primeira norma regulamentadora publicada em 1978. A reformulação de 2020 (Portaria 6.730) introduziu o conceito de **GRO – Gerenciamento de Riscos Ocupacionais** e o **PGR – Programa de Gerenciamento de Riscos**, substituindo o antigo PPRA. A Portaria MTE **1.419/2024** representa o terceiro grande marco: pela primeira vez, **riscos psicossociais** entram explicitamente no escopo do PGR, com vigência fiscalizatória a partir de **maio de 2026**.

**O que mudou na prática.**
1. **Identificação obrigatória de perigos psicossociais** (assédio, sobrecarga, baixo controle, falta de suporte, baixa justiça organizacional, etc.) usando metodologia validada.
2. **Avaliação de risco** com critérios técnicos — não basta listar, é preciso classificar severidade × probabilidade.
3. **Plano de ação** com responsáveis, prazos e evidência de execução.
4. **Reavaliação periódica** — mínimo anual, ou após mudança organizacional relevante.
5. **Documentação rastreável** — registros que sustentem fiscalização do MTE e eventual perícia trabalhista.

**Instrumentos aceitos.** A norma não impõe um instrumento único, mas a literatura técnica (Fundacentro, ISO 45003, OMS) recomenda questionários psicossociais validados — COPSOQ-III, Karasek, JCQ. O CompSmart adota COPSOQ-III adaptado, com 40 itens cobrindo 6 dimensões.

**Penalidades.** Multas por descumprimento variam de R$ 1.875 a R$ 6.708 por item, podendo ser dobradas em caso de reincidência (Portaria MTb 667/2021). Em caso de adoecimento mental relacionado, pode haver responsabilização civil (dano moral, dano existencial) e criminal (art. 132 CP).

**Defesa em fiscalização.** Os principais pontos checados pelo Auditor-Fiscal do Trabalho: (a) evidência de aplicação de instrumento; (b) participação dos trabalhadores; (c) plano de ação com prazos; (d) execução comprovada; (e) reavaliação documentada.

**Aplicação no CompSmart:** o módulo NR-1 da plataforma gera automaticamente todos os artefatos exigidos — relatório por dimensão, plano de ação assistido por IA, log de execução e dossiê de evidência exportável em PDF para fiscalização.`,
    linkPrincipal: { url: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/normas-regulamentadoras/nr-01-atualizada-2024.pdf', label: 'NR-1 atualizada (PDF oficial MTE)' },
    linkCompra: { url: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/ctpp-nrs/normas-regulamentadoras-nrs', label: 'Portal das NRs (gov.br)' },
  },
  {
    titulo: 'Talent Intelligence: A New Discipline for People-Driven Companies',
    autor: 'Josh Bersin',
    ano: 2022,
    categoria: 'Metodologia',
    resumoCurto: 'Bersin define a nova disciplina que integra Performance, Remuneração e Saúde em um único sistema de inteligência de talentos — base teórica da Matriz MCPS.',
    resumoCompleto: `Josh Bersin, fundador da Bersin & Associates (vendida à Deloitte) e hoje da The Josh Bersin Company, é o analista mais influente do mundo em tecnologia de RH. Em "Talent Intelligence" — distribuído como pesquisa-livro em sua plataforma — ele formaliza uma disciplina que vinha emergindo desde 2018: a integração de dados de performance, remuneração, saúde, aprendizado e mercado externo em um único sistema de tomada de decisão sobre pessoas.

**A tese central:** a maioria das empresas trata avaliação de desempenho, gestão de remuneração, mobilidade interna, sucessão e saúde mental como módulos isolados, geridos por times diferentes, com dados que não conversam. O resultado é incoerência: o melhor performer não é o mais bem pago; o mais alto potencial não está no plano de sucessão; o colaborador adoecendo não foi sinalizado pelo gestor. **Talent Intelligence** propõe um sistema único, com dados conectados, em que cada decisão informa as demais.

**Quatro camadas do sistema:**
1. **Workforce data** — quem está na empresa, em que cargo, com que histórico, salário, performance e engajamento.
2. **External market data** — benchmarks salariais, disponibilidade de talento, salários de referência por região.
3. **Skill intelligence** — mapeamento dinâmico de competências (skill ontology) e gaps de skill por equipe.
4. **Employee experience signals** — eNPS, pulse surveys, sinais comportamentais (uso de ferramentas, padrão de e-mail, ausências), com governança LGPD.

**Casos discutidos:** IBM e a IA Watson para sucessão; Unilever e a triagem por entrevista assíncrona; Spotify e o framework de squads + tribes para mobilidade; Google e o Project Oxygen para gestão de líderes.

Bersin é claro sobre o risco: sem governança forte de dados (privacidade, consentimento, viés algorítmico), Talent Intelligence vira vigilância. Com governança, vira estratégia.

**Aplicação no CompSmart:** este é o livro-base da arquitetura conceitual da plataforma. A integração entre Core (remuneração), Insight (mercado) e o módulo NR-1 (saúde) materializa o sistema único de inteligência de talentos proposto por Bersin. A Matriz MCPS (Mérito, Competência, Performance, Saúde) é nossa adaptação prática.`,
    linkPrincipal: { url: 'https://joshbersin.com/research/', label: 'Pesquisas oficiais do autor' },
    linkCompra: { url: 'https://joshbersin.com/josh-bersin-academy/', label: 'Josh Bersin Academy' },
  },
];

const CATEGORIAS = ['Todas', 'Saúde Mental', 'Liderança', 'Cultura', 'Performance', 'Direito', 'Metodologia'] as const;

export default function Nr1Biblioteca() {
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState<(typeof CATEGORIAS)[number]>('Todas');
  const [livroSel, setLivroSel] = useState<Livro | null>(null);

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
        l.resumoCurto.toLowerCase().includes(q) ||
        l.resumoCompleto.toLowerCase().includes(q);
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
          <TabsTrigger value="privacidade" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Privacidade & LGPD ({PRIVACIDADE_BLOCOS.length})
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
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{l.resumoCurto}</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setLivroSel(l)}
                    className="self-start px-0 text-[hsl(var(--nr1-primary))] mt-3"
                  >
                    Ler resumo <BookText className="h-3.5 w-3.5 ml-1" />
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

      {/* ====== DIALOG: Resumo do livro ====== */}
      <Dialog open={!!livroSel} onOpenChange={(o) => !o && setLivroSel(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          {livroSel && (
            <>
              <DialogHeader className="p-6 pb-3">
                <Badge variant="outline" className="w-fit text-[10px] mb-2">{livroSel.categoria}</Badge>
                <DialogTitle className="text-xl leading-tight">{livroSel.titulo}</DialogTitle>
                <DialogDescription className="text-sm">
                  {livroSel.autor} · {livroSel.ano}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[55vh] px-6">
                <div className="space-y-3 pb-4">
                  {livroSel.resumoCompleto.split('\n\n').map((par, i) => (
                    <p key={i} className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {par}
                    </p>
                  ))}
                </div>
              </ScrollArea>
              <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2 sm:gap-2 flex-col sm:flex-row sm:justify-end">
                {livroSel.linkPrincipal && (
                  <Button asChild variant="outline" size="sm">
                    <a href={livroSel.linkPrincipal.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      {livroSel.linkPrincipal.label}
                    </a>
                  </Button>
                )}
                {livroSel.linkCompra && (
                  <Button asChild size="sm" className="bg-[hsl(var(--nr1-primary))] hover:bg-[hsl(var(--nr1-primary)/0.9)]">
                    <a href={livroSel.linkCompra.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      {livroSel.linkCompra.label}
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
    <p className="text-sm leading-relaxed">{children}</p>
  </div>
);
