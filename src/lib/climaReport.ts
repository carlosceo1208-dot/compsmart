// Relatórios executivos (Item 5) — Pesquisa de Clima 360°
// Gera PDF executivo + exportações CSV consolidando clima + correlação COPSOQ + clima externo.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DIMENSAO_LABEL, CORRELACAO_COPSOQ, interpretarClima, type ClimaDimensao } from './climaQuestoes';
import { exportToCSV } from './csvExport';

export interface ClimaReportInput {
  empresa: { nome: string; fantasia?: string | null };
  pesquisa: {
    nome: string;
    periodo_inicio: string;
    periodo_fim: string | null;
    total_respondentes: number;
    score_geral: number | null;
    scores_dimensao: Record<string, number> | null;
    modalidade: string;
  };
  copsoq?: {
    score_geral: number | null;
    scores_dimensao: Record<string, number> | null;
  } | null;
  externo?: {
    total_respondentes: number;
    nps: number | null;
    by_stakeholder?: Record<string, { count: number; nps: number | null }>;
  } | null;
  responsavel?: string;
}

const fmt = (v: number | null | undefined, d = 1) => (v == null ? '—' : v.toFixed(d));
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—');

export function gerarClimaRelatorioPdf(input: ClimaReportInput): jsPDF {
  const doc = new jsPDF();
  const empresaNome = input.empresa.fantasia || input.empresa.nome;

  // Capa
  doc.setFillColor(232, 99, 74);
  doc.rect(0, 0, 210, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('Relatório Executivo de Clima 360°', 14, 25);
  doc.setFontSize(11);
  doc.text(empresaNome, 14, 36);
  doc.text(`Ciclo: ${input.pesquisa.nome}`, 14, 43);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  let y = 62;
  doc.text(`Período: ${fmtDate(input.pesquisa.periodo_inicio)} — ${fmtDate(input.pesquisa.periodo_fim)}`, 14, y);
  y += 6;
  doc.text(`Respondentes: ${input.pesquisa.total_respondentes}`, 14, y);
  y += 6;
  doc.text(`Score geral: ${fmt(input.pesquisa.score_geral)} / 5`, 14, y);
  y += 6;
  const interp = interpretarClima(input.pesquisa.score_geral);
  doc.text(`Interpretação: ${interp.label}`, 14, y);
  y += 10;

  // Sumário executivo
  doc.setFontSize(13);
  doc.text('Sumário Executivo', 14, y);
  y += 2;
  const dims = input.pesquisa.scores_dimensao
    ? (Object.entries(input.pesquisa.scores_dimensao) as [ClimaDimensao, number][])
    : [];
  const criticas = dims.filter(([, s]) => s <= 3.0).sort((a, b) => a[1] - b[1]);
  const fortes = [...dims].sort((a, b) => b[1] - a[1]).slice(0, 3);

  autoTable(doc, {
    startY: y + 4,
    head: [['Indicador', 'Valor']],
    body: [
      ['Score geral', `${fmt(input.pesquisa.score_geral)} / 5`],
      ['Total respondentes', String(input.pesquisa.total_respondentes)],
      ['Dimensões críticas (≤ 3,0)', String(criticas.length)],
      ['Dimensões fortes (top 3)', fortes.map(([d]) => DIMENSAO_LABEL[d]).join(' · ')],
    ],
    theme: 'grid',
    headStyles: { fillColor: [232, 99, 74] },
    styles: { fontSize: 9 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Dimensões
  doc.setFontSize(13);
  doc.text('Resultados por Dimensão', 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [['Dimensão', 'Score', 'Interpretação', 'Fator COPSOQ associado']],
    body: dims
      .sort((a, b) => b[1] - a[1])
      .map(([dim, s]) => [
        DIMENSAO_LABEL[dim],
        fmt(s),
        interpretarClima(s).label,
        CORRELACAO_COPSOQ[dim] || '—',
      ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 39, 97] },
    styles: { fontSize: 8 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Correlação COPSOQ
  if (input.copsoq && input.copsoq.scores_dimensao) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.text('Correlação Clima × Riscos Psicossociais (COPSOQ-III)', 14, y);
    const cops = input.copsoq.scores_dimensao;
    const rows = dims.map(([dim, climaScore]) => {
      const copKey = CORRELACAO_COPSOQ[dim];
      const copScore = cops[copKey] ?? null;
      const gap = copScore != null ? (climaScore - copScore).toFixed(2) : '—';
      const causaRaiz = climaScore <= 3.0 && copScore != null && copScore <= 3.0 ? 'SIM' : '—';
      return [
        DIMENSAO_LABEL[dim],
        fmt(climaScore),
        copScore != null ? fmt(copScore) : '—',
        gap,
        causaRaiz,
      ];
    });
    autoTable(doc, {
      startY: y + 3,
      head: [['Dimensão Clima', 'Score Clima', 'Score COPSOQ', 'Gap', 'Causa raiz?']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 8 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Externo / Employer Branding
  if (input.externo) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.text('Percepção Externa (Employer Branding)', 14, y);
    const body: any[] = [
      ['Total respondentes externos', String(input.externo.total_respondentes)],
      ['NPS externo', input.externo.nps != null ? input.externo.nps.toFixed(0) : '—'],
    ];
    if (input.externo.by_stakeholder) {
      Object.entries(input.externo.by_stakeholder).forEach(([k, v]) => {
        body.push([`└ ${k}`, `${v.count} resp. · NPS ${v.nps != null ? v.nps.toFixed(0) : '—'}`]);
      });
    }
    autoTable(doc, {
      startY: y + 3,
      head: [['Indicador', 'Valor']],
      body,
      theme: 'grid',
      headStyles: { fillColor: [30, 39, 97] },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Recomendações
  if (criticas.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.text('Recomendações Prioritárias', 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [['Prioridade', 'Dimensão', 'Ação sugerida']],
      body: criticas.slice(0, 5).map(([dim], i) => [
        i === 0 ? 'Crítica' : i < 2 ? 'Alta' : 'Média',
        DIMENSAO_LABEL[dim],
        gerarAcao(dim),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [232, 99, 74] },
      styles: { fontSize: 8 },
    });
  }

  // Rodapé
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `CompSmart · Relatório gerado em ${new Date().toLocaleString('pt-BR')} · Página ${i}/${total}`,
      14,
      290
    );
  }

  return doc;
}

function gerarAcao(dim: ClimaDimensao): string {
  const map: Record<ClimaDimensao, string> = {
    confianca_lideranca: 'Programa de desenvolvimento de líderes (mentoring + 360° trimestral).',
    seguranca_psicologica: 'Canal de denúncia independente + treinamento de NR-1/assédio.',
    reconhecimento_recompensa: 'Implantar programa estruturado de reconhecimento + revisão de mérito.',
    comunicacao_interna: 'Townhalls mensais + clareza de papéis (RACI por área).',
    desenvolvimento_profissional: 'PDI obrigatório + trilhas de carreira documentadas.',
    autonomia_empowerment: 'Delegação formal + revisão de matriz de aprovações.',
    equilibrio_trabalho_vida: 'Política de desconexão + auditoria de carga horária.',
    qualidade_ambiente: 'Avaliação ergonômica + plano de melhorias físicas.',
    relacionamento_colegas: 'Eventos de integração + facilitação de conflitos.',
    proposito_alinhamento: 'Reforço de missão/valores + storytelling de impacto.',
  };
  return map[dim];
}

// ---------- CSV ----------

export function exportClimaDimensoesCsv(input: ClimaReportInput) {
  const dims = input.pesquisa.scores_dimensao
    ? (Object.entries(input.pesquisa.scores_dimensao) as [ClimaDimensao, number][])
    : [];
  exportToCSV(
    `clima_${input.pesquisa.nome.replace(/\s+/g, '_')}_dimensoes.csv`,
    [
      { header: 'Dimensão', accessor: (r: [ClimaDimensao, number]) => DIMENSAO_LABEL[r[0]] },
      { header: 'Score (1-5)', accessor: (r) => r[1].toFixed(2).replace('.', ',') },
      { header: 'Interpretação', accessor: (r) => interpretarClima(r[1]).label },
      { header: 'Fator COPSOQ associado', accessor: (r) => CORRELACAO_COPSOQ[r[0]] },
    ],
    dims,
  );
}

export function exportClimaResumoCsv(input: ClimaReportInput) {
  const rows = [
    { campo: 'Empresa', valor: input.empresa.fantasia || input.empresa.nome },
    { campo: 'Ciclo', valor: input.pesquisa.nome },
    { campo: 'Período início', valor: fmtDate(input.pesquisa.periodo_inicio) },
    { campo: 'Período fim', valor: fmtDate(input.pesquisa.periodo_fim) },
    { campo: 'Respondentes', valor: String(input.pesquisa.total_respondentes) },
    { campo: 'Score geral', valor: fmt(input.pesquisa.score_geral) },
    { campo: 'Interpretação', valor: interpretarClima(input.pesquisa.score_geral).label },
    { campo: 'NPS externo', valor: input.externo?.nps != null ? input.externo.nps.toFixed(0) : '—' },
  ];
  exportToCSV(
    `clima_${input.pesquisa.nome.replace(/\s+/g, '_')}_resumo.csv`,
    [
      { header: 'Campo', accessor: (r: any) => r.campo },
      { header: 'Valor', accessor: (r: any) => r.valor },
    ],
    rows,
  );
}
