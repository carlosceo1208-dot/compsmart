// Gerador de PGR — Programa de Gerenciamento de Riscos (NR-1, item 1.5.4)
// Consolida diagnóstico(s) psicossocial(is) (COPSOQ-III) + plano de ação em PDF.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DIMENSAO_LABEL, RISCO_LABEL, type Dimensao } from './nr1';
import { GRAU_RISCO_INSS, type GrauRiscoInss } from './nr1Risco';
import type { Nr1PlanoAcao } from '@/hooks/useNr1PlanosAcao';

export interface PgrDiagnosticoInput {
  ciclo_nome: string;
  periodo_inicio: string;
  periodo_fim: string | null;
  score_geral: number | null;
  nivel_risco: string | null;
  scores_dimensao: Record<string, number> | null;
  total_respondentes: number;
}

export interface PgrInput {
  empresa: {
    nome: string;
    fantasia?: string | null;
    grauRiscoInss?: GrauRiscoInss | null;
  };
  diagnosticos: PgrDiagnosticoInput[];
  planoAcao: Nr1PlanoAcao[];
  escopo: 'consolidado' | 'ciclo';
  responsavel?: string;
}

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
};
const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente', em_andamento: 'Em andamento',
  concluido: 'Concluído', atrasado: 'Atrasado',
};

export function gerarPgrPdf(input: PgrInput): jsPDF {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const hoje = new Date().toLocaleDateString('pt-BR');
  const grauInfo = input.empresa.grauRiscoInss ? GRAU_RISCO_INSS[input.empresa.grauRiscoInss] : null;

  // ===== CAPA =====
  doc.setFillColor(0, 123, 255);
  doc.rect(0, 0, W, 50, 'F');
  doc.setTextColor(255);
  doc.setFontSize(22);
  doc.text('PGR — Programa de Gerenciamento de Riscos', 14, 25);
  doc.setFontSize(12);
  doc.text('Riscos Psicossociais (NR-1, item 1.5.4)', 14, 35);

  doc.setTextColor(0);
  doc.setFontSize(11);
  let y = 70;
  doc.text(`Empresa: ${input.empresa.fantasia || input.empresa.nome}`, 14, y); y += 7;
  if (input.empresa.fantasia) { doc.text(`Razão social: ${input.empresa.nome}`, 14, y); y += 7; }
  if (grauInfo) { doc.text(`Grau de Risco INSS: Grau ${grauInfo.grau} — ${grauInfo.label}`, 14, y); y += 7; }
  doc.text(`Data de emissão: ${hoje}`, 14, y); y += 7;
  doc.text(`Responsável técnico: ${input.responsavel || '__________________________'}`, 14, y); y += 7;
  doc.text(`Escopo: ${input.escopo === 'consolidado' ? 'Consolidado (todos os ciclos concluídos)' : 'Ciclo específico'}`, 14, y);

  // ===== 1. METODOLOGIA =====
  doc.addPage(); y = 20;
  doc.setFontSize(14); doc.text('1. Metodologia', 14, y); y += 8;
  doc.setFontSize(10);
  const metodologia =
    'O diagnóstico de riscos psicossociais foi realizado por meio de instrumento baseado no ' +
    'COPSOQ-III (Copenhagen Psychosocial Questionnaire — versão internacional validada), avaliando ' +
    '6 dimensões: Demandas no Trabalho, Organização e Conteúdo, Relações e Liderança, Interface ' +
    'Trabalho-Indivíduo, Valores no Trabalho e Saúde & Bem-Estar. As respostas são coletadas de forma ' +
    'anônima (hash SHA-256 do respondente, em conformidade com a LGPD) e os scores são normalizados ' +
    'em escala 0–100, classificados em quatro níveis: Baixo (0–40), Moderado (41–60), Alto (61–80) e ' +
    'Crítico (81–100). Esta metodologia atende aos requisitos da NR-1 (itens 1.5.3 a 1.5.5) quanto à ' +
    'identificação, avaliação e controle de riscos ocupacionais de natureza psicossocial.';
  const lines = doc.splitTextToSize(metodologia, W - 28);
  doc.text(lines, 14, y); y += lines.length * 5 + 6;

  // ===== 2. INVENTÁRIO DE RISCOS =====
  doc.setFontSize(14); doc.text('2. Inventário de Riscos Psicossociais', 14, y); y += 4;

  for (const diag of input.diagnosticos) {
    autoTable(doc, {
      startY: y + 4,
      head: [[`${diag.ciclo_nome} — Score ${diag.score_geral?.toFixed(1) ?? '—'}/100 · Risco: ${
        diag.nivel_risco ? RISCO_LABEL[diag.nivel_risco as keyof typeof RISCO_LABEL] : '—'
      } · ${diag.total_respondentes} respondentes`]],
      body: [],
      headStyles: { fillColor: [0, 123, 255], textColor: 255, fontSize: 10 },
    });
    const dims = Object.entries(diag.scores_dimensao ?? {}).sort((a, b) => b[1] - a[1]);
    autoTable(doc, {
      head: [['Dimensão Psicossocial', 'Score (0-100)', 'Nível']],
      body: dims.map(([d, s]) => {
        const n = Number(s);
        const nivel = n <= 40 ? 'Baixo' : n <= 60 ? 'Moderado' : n <= 80 ? 'Alto' : 'Crítico';
        return [DIMENSAO_LABEL[d as Dimensao] ?? d, n.toFixed(1), nivel];
      }),
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
    if (y > 250) { doc.addPage(); y = 20; }
  }

  // ===== 3. PLANO DE AÇÃO =====
  if (y > 220) { doc.addPage(); y = 20; }
  doc.setFontSize(14); doc.text('3. Plano de Ação (medidas de prevenção e controle)', 14, y); y += 2;
  if (input.planoAcao.length === 0) {
    autoTable(doc, {
      startY: y + 6,
      head: [['Aviso']],
      body: [['Nenhuma ação cadastrada. Recomenda-se criar ações específicas para as dimensões com score Alto/Crítico.']],
      styles: { fontSize: 9, textColor: [180, 60, 60] },
    });
  } else {
    autoTable(doc, {
      startY: y + 6,
      head: [['Ação', 'Dimensão', 'Responsável', 'Prazo', 'Prioridade', 'Status', '% ']],
      body: input.planoAcao.map((a) => [
        a.titulo,
        a.dimensao ? (DIMENSAO_LABEL[a.dimensao as Dimensao] ?? a.dimensao) : '—',
        a.responsavel ?? '—',
        a.prazo ? new Date(a.prazo).toLocaleDateString('pt-BR') : '—',
        PRIORIDADE_LABEL[a.prioridade] ?? a.prioridade,
        STATUS_LABEL[a.status] ?? a.status,
        `${a.progresso}%`,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 167, 69], textColor: 255 },
      columnStyles: { 0: { cellWidth: 50 } },
    });
  }

  // ===== 4. MONITORAMENTO =====
  doc.addPage(); y = 20;
  doc.setFontSize(14); doc.text('4. Monitoramento e Indicadores', 14, y); y += 8;
  doc.setFontSize(10);
  const monit =
    'O monitoramento das ações será realizado por meio de check-ins periódicos no módulo NR-1 da ' +
    'plataforma CompSmart, com atualização do progresso de cada ação, registro de evidências e ' +
    'reavaliação do diagnóstico em ciclos anuais (mínimo) ou sempre que houver mudança organizacional ' +
    'relevante (NR-1, item 1.5.5.2). Indicadores recomendados: % de ações concluídas no prazo, ' +
    'evolução dos scores por dimensão entre ciclos, taxa de participação dos colaboradores, eNPS, ' +
    'absenteísmo e turnover.';
  const monitLines = doc.splitTextToSize(monit, W - 28);
  doc.text(monitLines, 14, y); y += monitLines.length * 5 + 8;

  // ===== 5. CONFORMIDADE / ASSINATURAS =====
  doc.setFontSize(14); doc.text('5. Conformidade e Aprovação', 14, y); y += 8;
  doc.setFontSize(10);
  const conf =
    'Este PGR atende aos requisitos da NR-1 (Disposições Gerais e Gerenciamento de Riscos ' +
    'Ocupacionais), com foco em riscos psicossociais conforme atualização vigente. Deve ser mantido ' +
    'à disposição da fiscalização do MTE pelo período mínimo de 20 anos, contados a partir de sua ' +
    'elaboração ou revisão.';
  doc.text(doc.splitTextToSize(conf, W - 28), 14, y); y += 24;

  doc.text('_____________________________________', 14, y);
  doc.text('_____________________________________', 110, y); y += 5;
  doc.text('Responsável Técnico (SESMT/RH)', 14, y);
  doc.text('Empregador / Representante Legal', 110, y);

  // Rodapé com paginação
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text(`CompSmart · PGR NR-1 · Emitido em ${hoje} · Página ${i}/${total}`, 14, doc.internal.pageSize.getHeight() - 8);
  }

  return doc;
}
