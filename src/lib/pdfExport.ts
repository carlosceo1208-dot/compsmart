import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EvaluationDirectoryRow } from "@/hooks/usePerformanceEvaluations";
import { PDIWithRelations, pdiStatusLabels, pdiActionTypeLabels, PDIActionItem } from "@/hooks/usePerformancePDI";

const PRIMARY_COLOR: [number, number, number] = [79, 70, 229]; // Indigo-600
const TEXT_COLOR: [number, number, number] = [31, 41, 55]; // Gray-800
const MUTED_COLOR: [number, number, number] = [107, 114, 128]; // Gray-500
const SUCCESS_COLOR: [number, number, number] = [22, 163, 74]; // Green-600
const WARNING_COLOR: [number, number, number] = [202, 138, 4]; // Yellow-600

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Logo/Title area
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, 210, 30, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 18);
  
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 20, 25);
  }
  
  // Date
  doc.setFontSize(9);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 190, 18, { align: "right" });
}

function addSection(doc: jsPDF, y: number, title: string): number {
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y);
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.line(20, y + 2, 190, y + 2);
  return y + 10;
}

function addLabelValue(doc: jsPDF, y: number, label: string, value: string, x: number = 20): number {
  doc.setTextColor(...MUTED_COLOR);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(label, x, y);
  
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(value || "Não informado", x, y + 5);
  
  return y + 14;
}

function addScoreBox(doc: jsPDF, x: number, y: number, label: string, score: number) {
  const boxWidth = 75;
  const boxHeight = 30;
  
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, "S");
  
  doc.setTextColor(...MUTED_COLOR);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + 5, y + 8);
  
  const scoreColor = score >= 4 ? SUCCESS_COLOR : score >= 3 ? WARNING_COLOR : [220, 38, 38] as [number, number, number];
  doc.setTextColor(...scoreColor);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(score.toFixed(1), x + 5, y + 22);
  
  doc.setTextColor(...MUTED_COLOR);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("/ 5.0", x + 25, y + 22);
}

function addMultilineText(doc: jsPDF, y: number, text: string, maxWidth: number = 170): number {
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const lines = doc.splitTextToSize(text || "Não informado", maxWidth);
  doc.text(lines, 20, y);
  
  return y + (lines.length * 5) + 5;
}

export function exportEvaluationToPDF(evaluation: EvaluationDirectoryRow) {
  const doc = new jsPDF();
  
  const subtitle = `${evaluation.cycle_name || "Ciclo"} • ${evaluation.template_name || "Avaliação"}`;
  addHeader(doc, "Avaliação de Desempenho", subtitle);
  
  let y = 45;
  
  // Employee Info Section
  y = addSection(doc, y, "Colaborador");
  
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(evaluation.employee_full_name || "Colaborador", 20, y);
  y += 6;
  
  doc.setTextColor(...MUTED_COLOR);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const jobInfo = [evaluation.employee_job_title, evaluation.employee_grade ? `Grade ${evaluation.employee_grade}` : null]
    .filter(Boolean).join(" • ");
  doc.text(jobInfo || "Cargo não informado", 20, y);
  y += 15;
  
  // Scores Section
  y = addSection(doc, y, "Avaliação");
  
  addScoreBox(doc, 20, y, "Desempenho", evaluation.final_score ?? 0);
  addScoreBox(doc, 110, y, "Potencial", evaluation.potential_score ?? 0);
  y += 45;
  
  // Strengths Section
  y = addSection(doc, y, "Pontos Fortes");
  y = addMultilineText(doc, y, evaluation.strengths ?? "");
  y += 5;
  
  // Improvement Areas Section
  y = addSection(doc, y, "Áreas de Melhoria");
  y = addMultilineText(doc, y, evaluation.improvement_areas ?? "");
  y += 5;
  
  // Manager Comments Section
  if (evaluation.manager_comments) {
    y = addSection(doc, y, "Comentários do Gestor");
    y = addMultilineText(doc, y, evaluation.manager_comments);
  }
  
  // Footer
  doc.setTextColor(...MUTED_COLOR);
  doc.setFontSize(8);
  doc.text("CompSmart • Gestão de Remuneração Estratégica", 105, 285, { align: "center" });
  
  // Save
  const fileName = `avaliacao_${(evaluation.employee_full_name || "colaborador").replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}

export function exportPDIToPDF(pdi: PDIWithRelations, actionItems: PDIActionItem[]) {
  const doc = new jsPDF();
  
  addHeader(doc, "Plano de Desenvolvimento Individual", pdi.title);
  
  let y = 45;
  
  // Employee Info Section
  y = addSection(doc, y, "Colaborador");
  
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(pdi.employee?.full_name || "Colaborador", 20, y);
  y += 6;
  
  doc.setTextColor(...MUTED_COLOR);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(pdi.employee?.job_title || "Cargo não informado", 20, y);
  y += 15;
  
  // PDI Details Section
  y = addSection(doc, y, "Detalhes do PDI");
  
  // Status badge
  const statusColor: [number, number, number] = pdi.status === "completed" ? SUCCESS_COLOR : pdi.status === "in_progress" ? [59, 130, 246] : MUTED_COLOR;
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(20, y - 4, 50, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(pdiStatusLabels[pdi.status], 25, y + 1);
  y += 12;
  
  if (pdi.due_date) {
    y = addLabelValue(doc, y, "Data Limite", format(new Date(pdi.due_date), "dd/MM/yyyy", { locale: ptBR }));
  }
  
  if (pdi.description) {
    y = addSection(doc, y, "Descrição");
    y = addMultilineText(doc, y, pdi.description);
    y += 5;
  }
  
  // Action Items Section
  if (actionItems.length > 0) {
    y = addSection(doc, y, "Ações de Desenvolvimento");
    
    actionItems.forEach((item, index) => {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      // Checkbox
      doc.setDrawColor(...MUTED_COLOR);
      doc.setLineWidth(0.3);
      doc.rect(20, y - 4, 5, 5, "S");
      
      if (item.completed) {
        doc.setDrawColor(...SUCCESS_COLOR);
        doc.setLineWidth(0.5);
        doc.line(21, y - 1, 23, y);
        doc.line(23, y, 24, y - 3);
      }
      
      // Type badge
      doc.setFillColor(...PRIMARY_COLOR);
      doc.roundedRect(28, y - 4, 30, 6, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(pdiActionTypeLabels[item.type] || item.type, 30, y);
      
      // Text
      doc.setTextColor(...TEXT_COLOR);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(item.text, 125);
      doc.text(lines, 62, y);
      
      y += Math.max(lines.length * 5, 8) + 4;
    });
  }
  
  // Footer
  doc.setTextColor(...MUTED_COLOR);
  doc.setFontSize(8);
  doc.text("CompSmart • Gestão de Remuneração Estratégica", 105, 285, { align: "center" });
  
  // Save
  const fileName = `pdi_${(pdi.employee?.full_name || "colaborador").replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
