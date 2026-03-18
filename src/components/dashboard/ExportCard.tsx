import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useBudgetKPI } from "@/hooks/useBudgetKPI";
import { useBenefitsKPI } from "@/hooks/useBenefitsKPI";
import { useIncentivesKPI } from "@/hooks/useIncentivesKPI";
import { useEconomicData } from "@/hooks/useEconomicData";
import { formatCurrency, formatCurrencyCustom } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 
  | 'executive-consolidated' 
  | 'payroll-mass' 
  | 'people-analytics' 
  | 'benefits-incentives' 
  | 'budget-overview'
  | 'budget-approved-detail';

type ExportFormat = 'pdf' | 'excel' | 'both';

export const ExportCard = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('executive-consolidated');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [isGenerating, setIsGenerating] = useState(false);

  const { currency, convert } = useCurrencyConverter();
  
  // Fetch KPIs data
  const { data: totalEmployees } = useQuery({
    queryKey: ['dashboard-total-employees'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .not('employee_number', 'is', null);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: salaryData } = useQuery({
    queryKey: ['dashboard-salary-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('salary')
        .eq('status', 'active')
        .not('employee_number', 'is', null)
        .not('salary', 'is', null);
      if (error) throw error;
      
      const total = data.reduce((sum, p) => sum + (p.salary || 0), 0);
      const avg = data.length > 0 ? total / data.length : 0;
      
      return { total, avg, count: data.length };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: budgetKPI } = useBudgetKPI();
  const { data: benefitsKPI } = useBenefitsKPI();
  const { data: incentivesKPI } = useIncentivesKPI();
  const economicData = useEconomicData(12);

  // Fetch detailed data for reports
  const { data: detailedEmployees } = useQuery({
    queryKey: ['detailed-employees-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          full_name,
          job_title,
          grade,
          salary,
          salary_range_percentage,
          unit_id,
          status
        `)
        .eq('status', 'active')
        .not('employee_number', 'is', null)
        .not('salary', 'is', null)
        .order('salary', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: gradeDistribution } = useQuery({
    queryKey: ['grade-distribution-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('grade, salary')
        .eq('status', 'active')
        .not('salary', 'is', null)
        .not('grade', 'is', null);
      
      if (error) throw error;
      
      const grouped = data.reduce((acc, p) => {
        const grade = p.grade!;
        if (!acc[grade]) {
          acc[grade] = { salaries: [], count: 0 };
        }
        acc[grade].salaries.push(p.salary!);
        acc[grade].count++;
        return acc;
      }, {} as Record<string, { salaries: number[]; count: number }>);

      return Object.entries(grouped)
        .map(([grade, data]) => ({
          grade,
          count: data.count,
          avg: data.salaries.reduce((s, sal) => s + sal, 0) / data.count,
          min: Math.min(...data.salaries),
          max: Math.max(...data.salaries),
        }))
        .sort((a, b) => a.grade.localeCompare(b.grade));
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: unitDistribution } = useQuery({
    queryKey: ['unit-distribution-export'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('salary, unit_id')
        .eq('status', 'active')
        .not('salary', 'is', null)
        .not('unit_id', 'is', null);
      
      if (error) throw error;
      
      const unitIds = [...new Set(profiles.map(p => p.unit_id).filter(Boolean))];
      
      const { data: units } = await supabase
        .from('organizational_structure')
        .select('id, description')
        .in('id', unitIds);

      const grouped = profiles.reduce((acc, p) => {
        const unitId = p.unit_id!;
        if (!acc[unitId]) {
          acc[unitId] = { salaries: [], count: 0 };
        }
        acc[unitId].salaries.push(p.salary!);
        acc[unitId].count++;
        return acc;
      }, {} as Record<string, { salaries: number[]; count: number }>);

      return Object.entries(grouped)
        .map(([unitId, data]) => {
          const unit = units?.find(u => u.id === unitId);
          const total = data.salaries.reduce((s, sal) => s + sal, 0);
          return {
            name: unit?.description || 'Não definido',
            count: data.count,
            total,
            avg: total / data.count,
          };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: benefitsList } = useQuery({
    queryKey: ['benefits-list-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('benefits')
        .select('name, benefit_type, value_per_employee')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: incentivePrograms } = useQuery({
    queryKey: ['incentive-programs-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incentive_programs')
        .select('name, program_type, target_percentage, payment_frequency')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Buscar projeções de orçamento aprovado
  const { data: budgetProjections } = useQuery({
    queryKey: ['budget-projections-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_employee_projections')
        .select(`
          *,
          employee:profiles(full_name, job_title, salary, grade),
          projected_unit:organizational_structure(description, code),
          projected_job_title:job_titles(title)
        `)
        .eq('fiscal_year', 2026)
        .eq('is_active', true)
        .order('projected_unit_id');
      
      if (error) throw error;
      
      // Agrupar por unidade
      const byUnit = (data || []).reduce((acc: any, proj: any) => {
        const unitName = proj.projected_unit?.description || 'Não definida';
        if (!acc[unitName]) {
          acc[unitName] = {
            projections: [],
            plannedHires: 0,
            salaryChanges: 0,
            totalProjected: 0
          };
        }
        acc[unitName].projections.push(proj);
        if (proj.is_planned_hire) acc[unitName].plannedHires++;
        if (proj.change_type) acc[unitName].salaryChanges++;
        acc[unitName].totalProjected += proj.projected_fixed_salary || 0;
        return acc;
      }, {});
      
      return { raw: data, byUnit };
    },
    staleTime: 5 * 60 * 1000,
  });

  // PDF Generation Functions
  const generateExecutiveConsolidatedPDF = async (doc: any) => {
    const currentDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.text('CompSmart - Relatório Executivo Consolidado', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${currentDate}`, 14, 28);
    doc.text(`Moeda: ${currency}`, 14, 33);
    
    // KPIs Principais
    doc.setFontSize(14);
    doc.text('1. KPIs Principais', 14, 45);
    
    const kpiData = [
      ['Funcionários Ativos', totalEmployees?.toString() || '0'],
      ['Massa Salarial Total', formatCurrencyCustom(convert(salaryData?.total || 0, 'BRL', currency), currency)],
      ['Média Salarial', formatCurrencyCustom(convert(salaryData?.avg || 0, 'BRL', currency), currency)],
    ];
    
    autoTable(doc, {
      head: [['Indicador', 'Valor']],
      body: kpiData,
      startY: 50,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Orçamento
    const finalY1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('2. Budget (Orçamento vs Real)', 14, finalY1);
    
    const budgetData = [
      [
        'Salários',
        formatCurrencyCustom(convert(budgetKPI?.budgetedSalary || 0, 'BRL', currency), currency),
        formatCurrencyCustom(convert(budgetKPI?.realSalary || 0, 'BRL', currency), currency),
        formatCurrencyCustom(convert(budgetKPI?.salaryVariance || 0, 'BRL', currency), currency),
      ],
      [
        'Headcount',
        budgetKPI?.budgetedHeadcount?.toString() || '0',
        budgetKPI?.realHeadcount?.toString() || '0',
        budgetKPI?.headcountVariance?.toString() || '0',
      ],
    ];
    
    autoTable(doc, {
      head: [['Categoria', 'Orçado', 'Real', 'Variação']],
      body: budgetData,
      startY: finalY1 + 5,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Benefícios e Incentivos
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('3. Benefícios & Incentivos', 14, finalY2);
    
    const benefitsData = [
      ['Total de Benefícios Ativos', benefitsKPI?.totalBenefits?.toString() || '0'],
      ['Custo Mensal', formatCurrencyCustom(convert(benefitsKPI?.totalCost || 0, 'BRL', currency), currency)],
      ['Incentivos Curto Prazo (ICP)', formatCurrencyCustom(convert(incentivesKPI?.shortTerm || 0, 'BRL', currency), currency)],
      ['Incentivos Longo Prazo (ILP)', formatCurrencyCustom(convert(incentivesKPI?.longTerm || 0, 'BRL', currency), currency)],
      ['Total Incentivos', formatCurrencyCustom(convert(incentivesKPI?.total || 0, 'BRL', currency), currency)],
    ];
    
    autoTable(doc, {
      head: [['Item', 'Valor']],
      body: benefitsData,
      startY: finalY2 + 5,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Indicadores Econômicos
    const finalY3 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('4. Indicadores Econômicos', 14, finalY3);
    
    const economicDataTable = [
      ['INPC Mês Atual', `${economicData?.inpc?.monthly?.toFixed(2)}%` || 'N/A'],
      ['INPC Acumulado', `${economicData?.inpc?.accumulated?.toFixed(2)}%` || 'N/A'],
      ['USD (Cotação)', economicData?.usd?.value ? formatCurrency(economicData.usd.value) : 'N/A'],
    ];
    
    autoTable(doc, {
      head: [['Indicador', 'Valor']],
      body: economicDataTable,
      startY: finalY3 + 5,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  };

  const generatePayrollMassPDF = async (doc: any) => {
    const currentDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.text('CompSmart - Relatório de Massa Salarial', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${currentDate}`, 14, 28);
    doc.text(`Moeda: ${currency}`, 14, 33);
    
    // Resumo
    doc.setFontSize(14);
    doc.text('1. Resumo Geral', 14, 45);
    
    const summaryData = [
      ['Massa Salarial Total', formatCurrencyCustom(convert(salaryData?.total || 0, 'BRL', currency), currency)],
      ['Total de Funcionários', totalEmployees?.toString() || '0'],
      ['Média Salarial', formatCurrencyCustom(convert(salaryData?.avg || 0, 'BRL', currency), currency)],
    ];
    
    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: summaryData,
      startY: 50,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Distribuição por Grade
    const finalY1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('2. Distribuição por Grade', 14, finalY1);
    
    const gradeData = (gradeDistribution || []).map(g => [
      g.grade,
      g.count.toString(),
      formatCurrencyCustom(convert(g.avg, 'BRL', currency), currency),
      formatCurrencyCustom(convert(g.min, 'BRL', currency), currency),
      formatCurrencyCustom(convert(g.max, 'BRL', currency), currency),
    ]);
    
    autoTable(doc, {
      head: [['Grade', 'Qtd', 'Média', 'Mínimo', 'Máximo']],
      body: gradeData,
      startY: finalY1 + 5,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Top 10 Unidades
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('3. Top 10 Unidades (Massa Salarial)', 14, finalY2);
    
    const unitData = (unitDistribution || []).map(u => [
      u.name,
      u.count.toString(),
      formatCurrencyCustom(convert(u.total, 'BRL', currency), currency),
      formatCurrencyCustom(convert(u.avg, 'BRL', currency), currency),
    ]);
    
    autoTable(doc, {
      head: [['Unidade', 'Qtd', 'Total', 'Média']],
      body: unitData,
      startY: finalY2 + 5,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  };

  const generatePeopleAnalyticsPDF = async (doc: any) => {
    const currentDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.text('CompSmart - People Analytics Summary', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${currentDate}`, 14, 28);
    doc.text(`Moeda: ${currency}`, 14, 33);
    
    // KPIs
    doc.setFontSize(14);
    doc.text('1. Métricas Gerais', 14, 45);
    
    const metricsData = [
      ['Total de Funcionários', totalEmployees?.toString() || '0'],
      ['Média Salarial', formatCurrencyCustom(convert(salaryData?.avg || 0, 'BRL', currency), currency)],
      ['Massa Salarial', formatCurrencyCustom(convert(salaryData?.total || 0, 'BRL', currency), currency)],
    ];
    
    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: metricsData,
      startY: 50,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Top 10 Maiores Salários
    const finalY1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('2. Top 10 Maiores Salários', 14, finalY1);
    
    const topData = (detailedEmployees || []).slice(0, 10).map((emp, idx) => [
      (idx + 1).toString(),
      emp.full_name,
      emp.job_title || 'N/A',
      formatCurrencyCustom(convert(emp.salary || 0, 'BRL', currency), currency),
    ]);
    
    autoTable(doc, {
      head: [['#', 'Nome', 'Cargo', 'Salário']],
      body: topData,
      startY: finalY1 + 5,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Distribuição por Grade
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('3. Distribuição por Grade', 14, finalY2);
    
    const gradeData = (gradeDistribution || []).map(g => [
      g.grade,
      g.count.toString(),
      formatCurrencyCustom(convert(g.avg, 'BRL', currency), currency),
    ]);
    
    autoTable(doc, {
      head: [['Grade', 'Quantidade', 'Média Salarial']],
      body: gradeData,
      startY: finalY2 + 5,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  };

  const generateBenefitsIncentivesPDF = async (doc: any) => {
    const currentDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.text('CompSmart - Benefícios & Incentivos', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${currentDate}`, 14, 28);
    doc.text(`Moeda: ${currency}`, 14, 33);
    
    // Resumo de Benefícios
    doc.setFontSize(14);
    doc.text('1. Resumo de Benefícios', 14, 45);
    
    const benefitsSummary = [
      ['Total de Benefícios Ativos', benefitsKPI?.totalBenefits?.toString() || '0'],
      ['Custo Mensal Total', formatCurrencyCustom(convert(benefitsKPI?.totalCost || 0, 'BRL', currency), currency)],
      ['Funcionários Ativos', totalEmployees?.toString() || '0'],
    ];
    
    autoTable(doc, {
      head: [['Item', 'Valor']],
      body: benefitsSummary,
      startY: 50,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Lista de Benefícios
    const finalY1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('2. Benefícios Ativos', 14, finalY1);
    
    const benefitsData = (benefitsList || []).map(b => [
      b.name,
      b.benefit_type,
      formatCurrencyCustom(convert(b.value_per_employee || 0, 'BRL', currency), currency),
    ]);
    
    autoTable(doc, {
      head: [['Nome', 'Tipo', 'Valor/Funcionário']],
      body: benefitsData,
      startY: finalY1 + 5,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Incentivos
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('3. Programas de Incentivos', 14, finalY2);
    
    const incentivesData = [
      ['Incentivos Curto Prazo (ICP)', formatCurrencyCustom(convert(incentivesKPI?.shortTerm || 0, 'BRL', currency), currency)],
      ['Incentivos Longo Prazo (ILP)', formatCurrencyCustom(convert(incentivesKPI?.longTerm || 0, 'BRL', currency), currency)],
      ['Total de Incentivos', formatCurrencyCustom(convert(incentivesKPI?.total || 0, 'BRL', currency), currency)],
    ];
    
    autoTable(doc, {
      head: [['Programa', 'Provisão']],
      body: incentivesData,
      startY: finalY2 + 5,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Programas Detalhados
    if (incentivePrograms && incentivePrograms.length > 0) {
      const finalY3 = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('4. Detalhes dos Programas', 14, finalY3);
      
      const programsData = incentivePrograms.map(p => [
        p.name,
        p.program_type === 'short_term' ? 'ICP' : 'ILP',
        `${p.target_percentage}%`,
        p.payment_frequency || 'N/A',
      ]);
      
      autoTable(doc, {
        head: [['Nome', 'Tipo', '% Alvo', 'Frequência']],
        body: programsData,
        startY: finalY3 + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }
  };

  const generateBudgetOverviewPDF = async (doc: any) => {
    const currentDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.text('CompSmart - Budget Overview', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${currentDate}`, 14, 28);
    doc.text(`Moeda: ${currency}`, 14, 33);
    
    // Comparação Orçado vs Real
    doc.setFontSize(14);
    doc.text('1. Orçamento vs Realizado', 14, 45);
    
    const budgetComparison = [
      [
        'Salários',
        formatCurrencyCustom(convert(budgetKPI?.budgetedSalary || 0, 'BRL', currency), currency),
        formatCurrencyCustom(convert(budgetKPI?.realSalary || 0, 'BRL', currency), currency),
        formatCurrencyCustom(convert(budgetKPI?.salaryVariance || 0, 'BRL', currency), currency),
        budgetKPI?.budgetedSalary
          ? `${((budgetKPI.salaryVariance / budgetKPI.budgetedSalary) * 100).toFixed(2)}%`
          : '0%',
      ],
      [
        'Headcount',
        budgetKPI?.budgetedHeadcount?.toString() || '0',
        budgetKPI?.realHeadcount?.toString() || '0',
        budgetKPI?.headcountVariance?.toString() || '0',
        budgetKPI?.budgetedHeadcount
          ? `${((budgetKPI.headcountVariance / budgetKPI.budgetedHeadcount) * 100).toFixed(2)}%`
          : '0%',
      ],
    ];
    
    autoTable(doc, {
      head: [['Categoria', 'Orçado', 'Real', 'Variação', '% Variação']],
      body: budgetComparison,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Análise de Variação
    const finalY1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('2. Análise de Variação', 14, finalY1);
    
    const varianceAnalysis: string[][] = [];
    
    if (budgetKPI) {
      const salaryVariancePercent = budgetKPI.budgetedSalary
        ? (budgetKPI.salaryVariance / budgetKPI.budgetedSalary) * 100
        : 0;
      
      const headcountVariancePercent = budgetKPI.budgetedHeadcount
        ? (budgetKPI.headcountVariance / budgetKPI.budgetedHeadcount) * 100
        : 0;
      
      varianceAnalysis.push(
        [
          'Salários',
          salaryVariancePercent > 0 ? 'Acima do orçado' : salaryVariancePercent < 0 ? 'Abaixo do orçado' : 'No orçado',
          `${Math.abs(salaryVariancePercent).toFixed(2)}%`,
        ],
        [
          'Headcount',
          headcountVariancePercent > 0 ? 'Acima do orçado' : headcountVariancePercent < 0 ? 'Abaixo do orçado' : 'No orçado',
          `${Math.abs(headcountVariancePercent).toFixed(2)}%`,
        ]
      );
    }
    
    autoTable(doc, {
      head: [['Item', 'Status', 'Desvio']],
      body: varianceAnalysis,
      startY: finalY1 + 5,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  };

  // Excel Generation Functions using ExcelJS
  const generateExecutiveConsolidatedExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: KPIs Principais
    const ws1 = workbook.addWorksheet('KPIs Principais');
    ws1.addRow(['Indicador', 'Valor']);
    ws1.addRow(['Funcionários Ativos', totalEmployees || 0]);
    ws1.addRow(['Massa Salarial Total', salaryData?.total || 0]);
    ws1.addRow(['Média Salarial', salaryData?.avg || 0]);
    ws1.getRow(1).font = { bold: true };
    
    // Sheet 2: Budget
    const ws2 = workbook.addWorksheet('Budget');
    ws2.addRow(['Categoria', 'Orçado', 'Real', 'Variação', '% Variação']);
    ws2.addRow([
      'Salários',
      budgetKPI?.budgetedSalary || 0,
      budgetKPI?.realSalary || 0,
      budgetKPI?.salaryVariance || 0,
      budgetKPI?.budgetedSalary
        ? ((budgetKPI.salaryVariance / budgetKPI.budgetedSalary) * 100).toFixed(2)
        : '0',
    ]);
    ws2.addRow([
      'Headcount',
      budgetKPI?.budgetedHeadcount || 0,
      budgetKPI?.realHeadcount || 0,
      budgetKPI?.headcountVariance || 0,
      budgetKPI?.budgetedHeadcount
        ? ((budgetKPI.headcountVariance / budgetKPI.budgetedHeadcount) * 100).toFixed(2)
        : '0',
    ]);
    ws2.getRow(1).font = { bold: true };
    
    // Sheet 3: Benefícios e Incentivos
    const ws3 = workbook.addWorksheet('Benefícios e Incentivos');
    ws3.addRow(['Item', 'Valor']);
    ws3.addRow(['Total de Benefícios Ativos', benefitsKPI?.totalBenefits || 0]);
    ws3.addRow(['Custo Mensal de Benefícios', benefitsKPI?.totalCost || 0]);
    ws3.addRow(['Incentivos Curto Prazo (ICP)', incentivesKPI?.shortTerm || 0]);
    ws3.addRow(['Incentivos Longo Prazo (ILP)', incentivesKPI?.longTerm || 0]);
    ws3.addRow(['Total Incentivos', incentivesKPI?.total || 0]);
    ws3.getRow(1).font = { bold: true };
    
    // Sheet 4: Indicadores Econômicos
    const ws4 = workbook.addWorksheet('Indicadores Econômicos');
    ws4.addRow(['Indicador', 'Valor']);
    ws4.addRow(['INPC Mês Atual (%)', economicData?.inpc?.monthly || 0]);
    ws4.addRow(['INPC Acumulado (%)', economicData?.inpc?.accumulated || 0]);
    ws4.addRow(['USD Cotação (R$)', economicData?.usd?.value || 0]);
    ws4.getRow(1).font = { bold: true };
    
    return workbook;
  };

  const generatePayrollMassExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Resumo
    const ws1 = workbook.addWorksheet('Resumo');
    ws1.addRow(['Métrica', 'Valor']);
    ws1.addRow(['Massa Salarial Total', salaryData?.total || 0]);
    ws1.addRow(['Total de Funcionários', totalEmployees || 0]);
    ws1.addRow(['Média Salarial', salaryData?.avg || 0]);
    ws1.getRow(1).font = { bold: true };
    
    // Sheet 2: Distribuição por Grade
    const ws2 = workbook.addWorksheet('Por Grade');
    ws2.addRow(['Grade', 'Quantidade', 'Média', 'Mínimo', 'Máximo']);
    ws2.getRow(1).font = { bold: true };
    (gradeDistribution || []).forEach(g => {
      ws2.addRow([g.grade, g.count, g.avg, g.min, g.max]);
    });
    
    // Sheet 3: Distribuição por Unidade
    const ws3 = workbook.addWorksheet('Por Unidade');
    ws3.addRow(['Unidade', 'Quantidade', 'Total', 'Média']);
    ws3.getRow(1).font = { bold: true };
    (unitDistribution || []).forEach(u => {
      ws3.addRow([u.name, u.count, u.total, u.avg]);
    });
    
    return workbook;
  };

  const generatePeopleAnalyticsExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Métricas Gerais
    const ws1 = workbook.addWorksheet('Métricas');
    ws1.addRow(['Métrica', 'Valor']);
    ws1.addRow(['Total de Funcionários', totalEmployees || 0]);
    ws1.addRow(['Média Salarial', salaryData?.avg || 0]);
    ws1.addRow(['Massa Salarial', salaryData?.total || 0]);
    ws1.getRow(1).font = { bold: true };
    
    // Sheet 2: Top 10 Salários
    const ws2 = workbook.addWorksheet('Top 10 Salários');
    ws2.addRow(['#', 'Nome', 'Cargo', 'Grade', 'Salário']);
    ws2.getRow(1).font = { bold: true };
    (detailedEmployees || []).slice(0, 10).forEach((emp, idx) => {
      ws2.addRow([idx + 1, emp.full_name, emp.job_title || 'N/A', emp.grade || 'N/A', emp.salary || 0]);
    });
    
    // Sheet 3: Distribuição por Grade
    const ws3 = workbook.addWorksheet('Por Grade');
    ws3.addRow(['Grade', 'Quantidade', 'Média Salarial']);
    ws3.getRow(1).font = { bold: true };
    (gradeDistribution || []).forEach(g => {
      ws3.addRow([g.grade, g.count, g.avg]);
    });
    
    // Sheet 4: Distribuição por Unidade
    const ws4 = workbook.addWorksheet('Por Unidade');
    ws4.addRow(['Unidade', 'Quantidade', 'Total', 'Média']);
    ws4.getRow(1).font = { bold: true };
    (unitDistribution || []).forEach(u => {
      ws4.addRow([u.name, u.count, u.total, u.avg]);
    });
    
    return workbook;
  };

  const generateBenefitsIncentivesExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Resumo
    const ws1 = workbook.addWorksheet('Resumo');
    ws1.addRow(['Item', 'Valor']);
    ws1.addRow(['Total de Benefícios Ativos', benefitsKPI?.totalBenefits || 0]);
    ws1.addRow(['Custo Mensal Total', benefitsKPI?.totalCost || 0]);
    ws1.addRow(['Funcionários Ativos', totalEmployees || 0]);
    ws1.getRow(1).font = { bold: true };
    
    // Sheet 2: Lista de Benefícios
    const ws2 = workbook.addWorksheet('Benefícios');
    ws2.addRow(['Nome', 'Tipo', 'Valor/Funcionário']);
    ws2.getRow(1).font = { bold: true };
    (benefitsList || []).forEach(b => {
      ws2.addRow([b.name, b.benefit_type, b.value_per_employee || 0]);
    });
    
    // Sheet 3: Programas de Incentivos
    const ws3 = workbook.addWorksheet('Incentivos');
    ws3.addRow(['Programa', 'Provisão']);
    ws3.addRow(['Incentivos Curto Prazo (ICP)', incentivesKPI?.shortTerm || 0]);
    ws3.addRow(['Incentivos Longo Prazo (ILP)', incentivesKPI?.longTerm || 0]);
    ws3.addRow(['Total de Incentivos', incentivesKPI?.total || 0]);
    ws3.getRow(1).font = { bold: true };
    
    // Sheet 4: Detalhes dos Programas
    if (incentivePrograms && incentivePrograms.length > 0) {
      const ws4 = workbook.addWorksheet('Programas');
      ws4.addRow(['Nome', 'Tipo', '% Alvo', 'Frequência']);
      ws4.getRow(1).font = { bold: true };
      incentivePrograms.forEach(p => {
        ws4.addRow([
          p.name,
          p.program_type === 'short_term' ? 'ICP' : 'ILP',
          p.target_percentage || 0,
          p.payment_frequency || 'N/A',
        ]);
      });
    }
    
    return workbook;
  };

  const generateBudgetOverviewExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Comparação Orçado vs Real
    const ws1 = workbook.addWorksheet('Orçado vs Real');
    ws1.addRow(['Categoria', 'Orçado', 'Real', 'Variação', '% Variação']);
    ws1.addRow([
      'Salários',
      budgetKPI?.budgetedSalary || 0,
      budgetKPI?.realSalary || 0,
      budgetKPI?.salaryVariance || 0,
      budgetKPI?.budgetedSalary
        ? ((budgetKPI.salaryVariance / budgetKPI.budgetedSalary) * 100).toFixed(2)
        : '0',
    ]);
    ws1.addRow([
      'Headcount',
      budgetKPI?.budgetedHeadcount || 0,
      budgetKPI?.realHeadcount || 0,
      budgetKPI?.headcountVariance || 0,
      budgetKPI?.budgetedHeadcount
        ? ((budgetKPI.headcountVariance / budgetKPI.budgetedHeadcount) * 100).toFixed(2)
        : '0',
    ]);
    ws1.getRow(1).font = { bold: true };
    
    // Sheet 2: Análise de Variação
    const ws2 = workbook.addWorksheet('Análise de Variação');
    ws2.addRow(['Item', 'Status', 'Desvio (%)']);
    ws2.getRow(1).font = { bold: true };
    
    if (budgetKPI) {
      const salaryVariancePercent = budgetKPI.budgetedSalary
        ? (budgetKPI.salaryVariance / budgetKPI.budgetedSalary) * 100
        : 0;
      
      const headcountVariancePercent = budgetKPI.budgetedHeadcount
        ? (budgetKPI.headcountVariance / budgetKPI.budgetedHeadcount) * 100
        : 0;
      
      ws2.addRow([
        'Salários',
        salaryVariancePercent > 0 ? 'Acima' : salaryVariancePercent < 0 ? 'Abaixo' : 'No orçado',
        Math.abs(salaryVariancePercent).toFixed(2),
      ]);
      ws2.addRow([
        'Headcount',
        headcountVariancePercent > 0 ? 'Acima' : headcountVariancePercent < 0 ? 'Abaixo' : 'No orçado',
        Math.abs(headcountVariancePercent).toFixed(2),
      ]);
    }
    
    return workbook;
  };

  // Novo relatório PDF: Orçamento Aprovado Detalhado (Melhorado)
  const generateBudgetApprovedDetailPDF = async (doc: any) => {
    const currentDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    // === CAPA ===
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185);
    doc.text('CompSmart', 105, 50, { align: 'center' });
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Orçamento Aprovado', 105, 65, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Detalhamento Completo', 105, 78, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Ano Fiscal: 2026`, 105, 95, { align: 'center' });
    doc.text(`Moeda: ${currency}`, 105, 105, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Gerado em: ${currentDate}`, 105, 120, { align: 'center' });
    
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    
    // === 1. RESUMO EXECUTIVO ===
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text('1. Resumo Executivo', 14, 20);
    doc.setTextColor(0, 0, 0);
    
    // Calcular totais
    const rawData = budgetProjections?.raw || [];
    const totalFixed = rawData.reduce((sum: number, p: any) => sum + (p.projected_fixed_salary || 0), 0);
    const totalVariable = rawData.reduce((sum: number, p: any) => sum + (p.projected_variable_salary || 0), 0);
    const totalBenefits = rawData.reduce((sum: number, p: any) => sum + (p.projected_benefits || 0), 0);
    const grandTotal = totalFixed + totalVariable + totalBenefits;
    
    // Contar funcionários únicos
    const uniqueEmployeeIds = new Set(rawData.map((p: any) => p.employee_id || p.planned_employee_name).filter(Boolean));
    const headcount = uniqueEmployeeIds.size;
    
    const kpiData = [
      ['Total Orçado Anual', formatCurrencyCustom(convert(grandTotal, 'BRL', currency), currency)],
      ['Salários Fixos', formatCurrencyCustom(convert(totalFixed, 'BRL', currency), currency)],
      ['Remuneração Variável', formatCurrencyCustom(convert(totalVariable, 'BRL', currency), currency)],
      ['Benefícios', formatCurrencyCustom(convert(totalBenefits, 'BRL', currency), currency)],
      ['Headcount Projetado', headcount.toString()],
      ['Custo Médio por Funcionário/Mês', headcount > 0 ? formatCurrencyCustom(convert(grandTotal / headcount / 12, 'BRL', currency), currency) : 'N/A'],
    ];
    
    autoTable(doc, {
      head: [['Indicador', 'Valor']],
      body: kpiData,
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // === 2. BREAKDOWN POR UNIDADE ORGANIZACIONAL ===
    const finalY1 = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text('2. Breakdown por Unidade Organizacional', 14, finalY1);
    doc.setTextColor(0, 0, 0);
    
    const unitBreakdown = Object.entries(budgetProjections?.byUnit || {}).map(
      ([unit, data]: [string, any]) => {
        const fixed = data.projections.reduce((sum: number, p: any) => sum + (p.projected_fixed_salary || 0), 0);
        const variable = data.projections.reduce((sum: number, p: any) => sum + (p.projected_variable_salary || 0), 0);
        const benefits = data.projections.reduce((sum: number, p: any) => sum + (p.projected_benefits || 0), 0);
        const uniqueInUnit = new Set(data.projections.map((p: any) => p.employee_id || p.planned_employee_name));
        
        return [
          unit,
          uniqueInUnit.size.toString(),
          formatCurrencyCustom(convert(fixed, 'BRL', currency), currency),
          formatCurrencyCustom(convert(variable, 'BRL', currency), currency),
          formatCurrencyCustom(convert(benefits, 'BRL', currency), currency),
          formatCurrencyCustom(convert(fixed + variable + benefits, 'BRL', currency), currency),
        ];
      }
    );
    
    // Linha de TOTAL
    unitBreakdown.push([
      'TOTAL',
      headcount.toString(),
      formatCurrencyCustom(convert(totalFixed, 'BRL', currency), currency),
      formatCurrencyCustom(convert(totalVariable, 'BRL', currency), currency),
      formatCurrencyCustom(convert(totalBenefits, 'BRL', currency), currency),
      formatCurrencyCustom(convert(grandTotal, 'BRL', currency), currency),
    ]);
    
    (doc as any).autoTable({
      head: [['Unidade', 'HC', 'Fixo', 'Variável', 'Benefícios', 'Total']],
      body: unitBreakdown,
      startY: finalY1 + 5,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] },
      footStyles: { fontStyle: 'bold', fillColor: [236, 240, 241] },
    });
    
    // === 3. DISTRIBUIÇÃO POR CATEGORIA DE CUSTO ===
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text('3. Distribuição por Categoria de Custo', 14, 20);
    doc.setTextColor(0, 0, 0);
    
    const categoryBreakdown = [
      ['Salários Fixos', formatCurrencyCustom(convert(totalFixed, 'BRL', currency), currency), `${((totalFixed / grandTotal) * 100).toFixed(1)}%`],
      ['Remuneração Variável', formatCurrencyCustom(convert(totalVariable, 'BRL', currency), currency), `${((totalVariable / grandTotal) * 100).toFixed(1)}%`],
      ['Benefícios', formatCurrencyCustom(convert(totalBenefits, 'BRL', currency), currency), `${((totalBenefits / grandTotal) * 100).toFixed(1)}%`],
      ['TOTAL', formatCurrencyCustom(convert(grandTotal, 'BRL', currency), currency), '100%'],
    ];
    
    (doc as any).autoTable({
      head: [['Categoria', 'Valor', '% do Total']],
      body: categoryBreakdown,
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [155, 89, 182] },
    });
    
    // === 4. DETALHAMENTO POR FUNCIONÁRIO ===
    const finalY3 = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text('4. Detalhamento por Funcionário', 14, finalY3);
    doc.setTextColor(0, 0, 0);
    
    let currentY = finalY3 + 5;
    
    for (const [unitName, unitData] of Object.entries(budgetProjections?.byUnit || {})) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.text(`📁 ${unitName}`, 14, currentY);
      doc.setTextColor(0, 0, 0);
      
      // Filtrar funcionários únicos
      const employeeRows = (unitData as any).projections
        .filter((p: any, index: number, self: any[]) => 
          index === self.findIndex((t: any) => 
            (t.employee_id || t.planned_employee_name) === (p.employee_id || p.planned_employee_name)
          )
        )
        .map((p: any) => [
          p.is_planned_hire ? `🆕 ${p.planned_employee_name}` : (p.employee?.full_name || 'N/A'),
          p.projected_job_title?.title || p.employee?.job_title || 'N/A',
          p.projected_grade || p.employee?.grade || 'N/A',
          formatCurrencyCustom(convert(p.projected_fixed_salary || 0, 'BRL', currency), currency),
          formatCurrencyCustom(convert(p.projected_variable_salary || 0, 'BRL', currency), currency),
          formatCurrencyCustom(convert(p.projected_benefits || 0, 'BRL', currency), currency),
        ]);
      
      autoTable(doc, {
        head: [['Funcionário', 'Cargo', 'Grade', 'Fixo', 'Variável', 'Benefícios']],
        body: employeeRows,
        startY: currentY + 3,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [127, 140, 141] },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // === 5. CONTRATAÇÕES PLANEJADAS ===
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(39, 174, 96);
    doc.text('5. Contratações Planejadas', 14, 20);
    doc.setTextColor(0, 0, 0);
    
    const plannedHires = rawData.filter((p: any) => p.is_planned_hire);
    // Filtrar únicos
    const uniqueHires = plannedHires.filter((p: any, index: number, self: any[]) => 
      index === self.findIndex((t: any) => t.planned_employee_name === p.planned_employee_name)
    );
    
    if (uniqueHires.length > 0) {
      const hiresRows = uniqueHires.map((p: any) => [
        p.planned_employee_name,
        p.projected_unit?.description || 'N/A',
        `Mês ${p.month}`,
        p.projected_grade || 'N/A',
        formatCurrencyCustom(convert(p.projected_fixed_salary || 0, 'BRL', currency), currency),
        (p.justification || 'N/A').substring(0, 40),
      ]);
      
      autoTable(doc, {
        head: [['Nome', 'Unidade', 'Mês Contratação', 'Grade', 'Salário', 'Justificativa']],
        body: hiresRows,
        startY: 25,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [39, 174, 96] },
      });
    } else {
      doc.setFontSize(10);
      doc.text('Nenhuma contratação planejada para este período.', 14, 30);
    }
    
    // === 6. ALTERAÇÕES SALARIAIS ===
    const finalY5 = uniqueHires.length > 0 ? (doc as any).lastAutoTable.finalY + 15 : 45;
    doc.setFontSize(16);
    doc.setTextColor(230, 126, 34);
    doc.text('6. Alterações Salariais (Mérito/Ajuste)', 14, finalY5);
    doc.setTextColor(0, 0, 0);
    
    const salaryChanges = rawData.filter((p: any) => 
      p.change_type && !p.is_planned_hire && !['promotion'].includes(p.change_type)
    );
    // Filtrar únicos
    const uniqueChanges = salaryChanges.filter((p: any, index: number, self: any[]) => 
      index === self.findIndex((t: any) => t.employee_id === p.employee_id)
    );
    
    if (uniqueChanges.length > 0) {
      const changesRows = uniqueChanges.map((p: any) => {
        const current = p.employee?.salary || 0;
        const projected = p.projected_fixed_salary || 0;
        const pctChange = current > 0 ? ((projected - current) / current * 100).toFixed(1) : '0.0';
        return [
          p.employee?.full_name || 'N/A',
          p.change_type === 'merit' ? 'Mérito' : 'Ajuste',
          `Mês ${p.month}`,
          formatCurrencyCustom(convert(current, 'BRL', currency), currency),
          formatCurrencyCustom(convert(projected, 'BRL', currency), currency),
          `${pctChange}%`,
        ];
      });
      
      autoTable(doc, {
        head: [['Funcionário', 'Tipo', 'Mês', 'Salário Atual', 'Salário Novo', '% Aumento']],
        body: changesRows,
        startY: finalY5 + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [230, 126, 34] },
      });
    } else {
      doc.setFontSize(10);
      doc.text('Nenhuma alteração salarial planejada.', 14, finalY5 + 10);
    }
    
    // === 7. PROMOÇÕES DE CARGO ===
    const finalY6 = uniqueChanges.length > 0 ? (doc as any).lastAutoTable.finalY + 15 : finalY5 + 25;
    
    if (finalY6 > 250) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(142, 68, 173);
      doc.text('7. Promoções de Cargo', 14, 20);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFontSize(16);
      doc.setTextColor(142, 68, 173);
      doc.text('7. Promoções de Cargo', 14, finalY6);
      doc.setTextColor(0, 0, 0);
    }
    
    const promotions = rawData.filter((p: any) => p.change_type === 'promotion');
    const uniquePromos = promotions.filter((p: any, index: number, self: any[]) => 
      index === self.findIndex((t: any) => t.employee_id === p.employee_id)
    );
    
    if (uniquePromos.length > 0) {
      const promoRows = uniquePromos.map((p: any) => {
        const current = p.employee?.salary || 0;
        const projected = p.projected_fixed_salary || 0;
        return [
          p.employee?.full_name || 'N/A',
          p.employee?.job_title || 'N/A',
          p.projected_job_title?.title || 'N/A',
          `Mês ${p.month}`,
          formatCurrencyCustom(convert(current, 'BRL', currency), currency),
          formatCurrencyCustom(convert(projected, 'BRL', currency), currency),
        ];
      });
      
      autoTable(doc, {
        head: [['Funcionário', 'Cargo Atual', 'Novo Cargo', 'Mês', 'Salário Atual', 'Salário Novo']],
        body: promoRows,
        startY: finalY6 > 250 ? 25 : finalY6 + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [142, 68, 173] },
      });
    } else {
      doc.setFontSize(10);
      doc.text('Nenhuma promoção planejada.', 14, finalY6 > 250 ? 30 : finalY6 + 10);
    }
    
    // === RODAPÉ EM TODAS AS PÁGINAS ===
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `CompSmart - Relatório Orçamentário ${new Date().getFullYear()} | Página ${i} de ${pageCount}`,
        105,
        285,
        { align: 'center' }
      );
    }
  };

  const generateExcelReport = async (reportType: ReportType) => {
    const ExcelJS = (await import('exceljs')).default;
    
    let workbook: any;
    
    switch (reportType) {
      case 'executive-consolidated':
        workbook = await generateExecutiveConsolidatedExcel();
        break;
      case 'payroll-mass':
        workbook = await generatePayrollMassExcel();
        break;
      case 'people-analytics':
        workbook = await generatePeopleAnalyticsExcel();
        break;
      case 'benefits-incentives':
        workbook = await generateBenefitsIncentivesExcel();
        break;
      case 'budget-overview':
        workbook = await generateBudgetOverviewExcel();
        break;
      case 'budget-approved-detail':
        // Para Excel, criar planilha simples com todas as projeções
        workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Projeções Orçamento');
        ws.addRow(['Funcionário/Nome', 'Unidade', 'Tipo', 'Mês', 'Grade', 'Salário Projetado', 'Justificativa']);
        ws.getRow(1).font = { bold: true };
        (budgetProjections?.raw || []).forEach((p: any) => {
          ws.addRow([
            p.is_planned_hire ? p.planned_employee_name : p.employee?.full_name,
            p.projected_unit?.description || 'N/A',
            p.is_planned_hire ? 'Contratação' : (p.change_type || 'Manutenção'),
            p.month,
            p.projected_grade || p.employee?.grade || 'N/A',
            p.projected_fixed_salary || 0,
            p.justification || 'Sem justificativa'
          ]);
        });
        break;
      default:
        workbook = new ExcelJS.Workbook();
    }
    
    const fileName = `compsmart_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = async (reportType: ReportType) => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    
    switch (reportType) {
      case 'executive-consolidated':
        await generateExecutiveConsolidatedPDF(doc);
        break;
      case 'payroll-mass':
        await generatePayrollMassPDF(doc);
        break;
      case 'people-analytics':
        await generatePeopleAnalyticsPDF(doc);
        break;
      case 'benefits-incentives':
        await generateBenefitsIncentivesPDF(doc);
        break;
      case 'budget-overview':
        await generateBudgetOverviewPDF(doc);
        break;
      case 'budget-approved-detail':
        await generateBudgetApprovedDetailPDF(doc);
        break;
    }
    
    const fileName = `compsmart_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      if (exportFormat === 'pdf' || exportFormat === 'both') {
        toast.info('Gerando PDF...', { duration: 2000 });
        await generatePDFReport(selectedReport);
      }
      
      if (exportFormat === 'excel' || exportFormat === 'both') {
        toast.info('Gerando Excel...', { duration: 2000 });
        await generateExcelReport(selectedReport);
      }
      
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Relatórios Rápidos</CardTitle>
        </div>
        <CardDescription>
          Relatórios executivos consolidados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Select de Tipo de Relatório */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Selecione o Relatório
          </Label>
          <Select value={selectedReport} onValueChange={(v) => setSelectedReport(v as ReportType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executive-consolidated">
                📊 Consolidado Executivo
              </SelectItem>
              <SelectItem value="payroll-mass">
                💰 Massa Salarial
              </SelectItem>
              <SelectItem value="people-analytics">
                👥 People Analytics Summary
              </SelectItem>
              <SelectItem value="benefits-incentives">
                🎁 Benefícios & Incentivos
              </SelectItem>
              <SelectItem value="budget-overview">
                📈 Budget Overview
              </SelectItem>
              <SelectItem value="budget-approved-detail">
                📋 Orçamento Aprovado Detalhado
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* RadioGroup de Formato */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Formato
          </Label>
          <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf-format" />
                <Label htmlFor="pdf-format" className="cursor-pointer font-normal">
                  📄 PDF Executivo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel-format" />
                <Label htmlFor="excel-format" className="cursor-pointer font-normal">
                  📊 Excel (Dados Completos)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both-format" />
                <Label htmlFor="both-format" className="cursor-pointer font-normal">
                  📦 Ambos (PDF + Excel)
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Botão de Geração */}
        <Button
          className="w-full"
          onClick={handleGenerateReport}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Gerar Relatório
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
