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
        .eq('status', 'active');
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
      
      (doc as any).autoTable({
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
    
    (doc as any).autoTable({
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
    
    (doc as any).autoTable({
      head: [['Item', 'Status', 'Desvio']],
      body: varianceAnalysis,
      startY: finalY1 + 5,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  };

  const generatePDFReport = async (reportType: ReportType) => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
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
    }
    
    const fileName = `compsmart_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
  };

  // Excel Generation Functions
  const generateExecutiveConsolidatedExcel = async (XLSX: any) => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: KPIs Principais
    const kpisData = [
      ['Indicador', 'Valor'],
      ['Funcionários Ativos', totalEmployees || 0],
      ['Massa Salarial Total', salaryData?.total || 0],
      ['Média Salarial', salaryData?.avg || 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(kpisData);
    XLSX.utils.book_append_sheet(wb, ws1, 'KPIs Principais');
    
    // Sheet 2: Budget
    const budgetData = [
      ['Categoria', 'Orçado', 'Real', 'Variação', '% Variação'],
      [
        'Salários',
        budgetKPI?.budgetedSalary || 0,
        budgetKPI?.realSalary || 0,
        budgetKPI?.salaryVariance || 0,
        budgetKPI?.budgetedSalary
          ? ((budgetKPI.salaryVariance / budgetKPI.budgetedSalary) * 100).toFixed(2)
          : '0',
      ],
      [
        'Headcount',
        budgetKPI?.budgetedHeadcount || 0,
        budgetKPI?.realHeadcount || 0,
        budgetKPI?.headcountVariance || 0,
        budgetKPI?.budgetedHeadcount
          ? ((budgetKPI.headcountVariance / budgetKPI.budgetedHeadcount) * 100).toFixed(2)
          : '0',
      ],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(budgetData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Budget');
    
    // Sheet 3: Benefícios e Incentivos
    const benefitsData = [
      ['Item', 'Valor'],
      ['Total de Benefícios Ativos', benefitsKPI?.totalBenefits || 0],
      ['Custo Mensal de Benefícios', benefitsKPI?.totalCost || 0],
      ['Incentivos Curto Prazo (ICP)', incentivesKPI?.shortTerm || 0],
      ['Incentivos Longo Prazo (ILP)', incentivesKPI?.longTerm || 0],
      ['Total Incentivos', incentivesKPI?.total || 0],
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(benefitsData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Benefícios e Incentivos');
    
    // Sheet 4: Indicadores Econômicos
    const economicDataSheet = [
      ['Indicador', 'Valor'],
      ['INPC Mês Atual (%)', economicData?.inpc?.monthly || 0],
      ['INPC Acumulado (%)', economicData?.inpc?.accumulated || 0],
      ['USD Cotação (R$)', economicData?.usd?.value || 0],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(economicDataSheet);
    XLSX.utils.book_append_sheet(wb, ws4, 'Indicadores Econômicos');
    
    return wb;
  };

  const generatePayrollMassExcel = async (XLSX: any) => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Resumo
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Massa Salarial Total', salaryData?.total || 0],
      ['Total de Funcionários', totalEmployees || 0],
      ['Média Salarial', salaryData?.avg || 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');
    
    // Sheet 2: Distribuição por Grade
    const gradeData = [
      ['Grade', 'Quantidade', 'Média', 'Mínimo', 'Máximo'],
      ...(gradeDistribution || []).map(g => [
        g.grade,
        g.count,
        g.avg,
        g.min,
        g.max,
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(gradeData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Por Grade');
    
    // Sheet 3: Distribuição por Unidade
    const unitData = [
      ['Unidade', 'Quantidade', 'Total', 'Média'],
      ...(unitDistribution || []).map(u => [
        u.name,
        u.count,
        u.total,
        u.avg,
      ]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(unitData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Por Unidade');
    
    return wb;
  };

  const generatePeopleAnalyticsExcel = async (XLSX: any) => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Métricas Gerais
    const metricsData = [
      ['Métrica', 'Valor'],
      ['Total de Funcionários', totalEmployees || 0],
      ['Média Salarial', salaryData?.avg || 0],
      ['Massa Salarial', salaryData?.total || 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Métricas');
    
    // Sheet 2: Top 10 Salários
    const topData = [
      ['#', 'Nome', 'Cargo', 'Grade', 'Salário'],
      ...(detailedEmployees || []).slice(0, 10).map((emp, idx) => [
        idx + 1,
        emp.full_name,
        emp.job_title || 'N/A',
        emp.grade || 'N/A',
        emp.salary || 0,
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(topData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Top 10 Salários');
    
    // Sheet 3: Distribuição por Grade
    const gradeData = [
      ['Grade', 'Quantidade', 'Média Salarial'],
      ...(gradeDistribution || []).map(g => [g.grade, g.count, g.avg]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(gradeData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Por Grade');
    
    // Sheet 4: Distribuição por Unidade
    const unitData = [
      ['Unidade', 'Quantidade', 'Total', 'Média'],
      ...(unitDistribution || []).map(u => [u.name, u.count, u.total, u.avg]),
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(unitData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Por Unidade');
    
    return wb;
  };

  const generateBenefitsIncentivesExcel = async (XLSX: any) => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Resumo
    const summaryData = [
      ['Item', 'Valor'],
      ['Total de Benefícios Ativos', benefitsKPI?.totalBenefits || 0],
      ['Custo Mensal Total', benefitsKPI?.totalCost || 0],
      ['Funcionários Ativos', totalEmployees || 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');
    
    // Sheet 2: Lista de Benefícios
    const benefitsData = [
      ['Nome', 'Tipo', 'Valor/Funcionário'],
      ...(benefitsList || []).map(b => [
        b.name,
        b.benefit_type,
        b.value_per_employee || 0,
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(benefitsData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Benefícios');
    
    // Sheet 3: Programas de Incentivos
    const incentivesData = [
      ['Programa', 'Provisão'],
      ['Incentivos Curto Prazo (ICP)', incentivesKPI?.shortTerm || 0],
      ['Incentivos Longo Prazo (ILP)', incentivesKPI?.longTerm || 0],
      ['Total de Incentivos', incentivesKPI?.total || 0],
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(incentivesData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Incentivos');
    
    // Sheet 4: Detalhes dos Programas
    if (incentivePrograms && incentivePrograms.length > 0) {
      const programsData = [
        ['Nome', 'Tipo', '% Alvo', 'Frequência'],
        ...incentivePrograms.map(p => [
          p.name,
          p.program_type === 'short_term' ? 'ICP' : 'ILP',
          p.target_percentage || 0,
          p.payment_frequency || 'N/A',
        ]),
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(programsData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Programas');
    }
    
    return wb;
  };

  const generateBudgetOverviewExcel = async (XLSX: any) => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Comparação Orçado vs Real
    const comparisonData = [
      ['Categoria', 'Orçado', 'Real', 'Variação', '% Variação'],
      [
        'Salários',
        budgetKPI?.budgetedSalary || 0,
        budgetKPI?.realSalary || 0,
        budgetKPI?.salaryVariance || 0,
        budgetKPI?.budgetedSalary
          ? ((budgetKPI.salaryVariance / budgetKPI.budgetedSalary) * 100).toFixed(2)
          : '0',
      ],
      [
        'Headcount',
        budgetKPI?.budgetedHeadcount || 0,
        budgetKPI?.realHeadcount || 0,
        budgetKPI?.headcountVariance || 0,
        budgetKPI?.budgetedHeadcount
          ? ((budgetKPI.headcountVariance / budgetKPI.budgetedHeadcount) * 100).toFixed(2)
          : '0',
      ],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(comparisonData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Orçado vs Real');
    
    // Sheet 2: Análise de Variação
    const varianceData: any[] = [['Item', 'Status', 'Desvio (%)']];
    
    if (budgetKPI) {
      const salaryVariancePercent = budgetKPI.budgetedSalary
        ? (budgetKPI.salaryVariance / budgetKPI.budgetedSalary) * 100
        : 0;
      
      const headcountVariancePercent = budgetKPI.budgetedHeadcount
        ? (budgetKPI.headcountVariance / budgetKPI.budgetedHeadcount) * 100
        : 0;
      
      varianceData.push(
        [
          'Salários',
          salaryVariancePercent > 0 ? 'Acima' : salaryVariancePercent < 0 ? 'Abaixo' : 'No orçado',
          Math.abs(salaryVariancePercent).toFixed(2),
        ],
        [
          'Headcount',
          headcountVariancePercent > 0 ? 'Acima' : headcountVariancePercent < 0 ? 'Abaixo' : 'No orçado',
          Math.abs(headcountVariancePercent).toFixed(2),
        ]
      );
    }
    
    const ws2 = XLSX.utils.aoa_to_sheet(varianceData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Análise de Variação');
    
    return wb;
  };

  // Novo relatório PDF: Orçamento Aprovado Detalhado
  const generateBudgetApprovedDetailPDF = async (doc: any) => {
    const currentDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.text('CompSmart - Orçamento Aprovado Detalhado', 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${currentDate}`, 14, 28);
    doc.text('Ano Fiscal: 2026', 14, 33);
    
    // SEÇÃO 1: Resumo por Unidade Organizacional
    doc.setFontSize(14);
    doc.text('1. Resumo por Unidade Organizacional', 14, 45);
    
    const unitSummary = Object.entries(budgetProjections?.byUnit || {}).map(
      ([unit, data]: [string, any]) => [
        unit,
        data.projections.length,
        data.plannedHires,
        data.salaryChanges,
        formatCurrency(data.totalProjected)
      ]
    );
    
    (doc as any).autoTable({
      head: [['Unidade', 'Projeções', 'Contratações', 'Alt. Salário', 'Total Projetado']],
      body: unitSummary,
      startY: 50,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // SEÇÃO 2: Contratações Planejadas (detalhado)
    const finalY1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('2. Contratações Planejadas', 14, finalY1);
    
    const plannedHires = budgetProjections?.raw
      ?.filter((p: any) => p.is_planned_hire)
      ?.map((p: any) => [
        p.planned_employee_name || 'N/A',
        p.projected_unit?.description || 'N/A',
        `Mês ${p.month}`,
        p.projected_grade || 'N/A',
        formatCurrency(p.projected_fixed_salary || 0),
        (p.justification || 'Sem justificativa').substring(0, 50)
      ]) || [];
    
    if (plannedHires.length > 0) {
      (doc as any).autoTable({
        head: [['Nome', 'Unidade', 'Mês', 'Grade', 'Salário', 'Justificativa']],
        body: plannedHires,
        startY: finalY1 + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] },
      });
    } else {
      doc.setFontSize(10);
      doc.text('Nenhuma contratação planejada', 14, finalY1 + 5);
    }

    // SEÇÃO 3: Alterações Salariais (mérito, promoção, etc)
    const finalY2 = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : finalY1 + 25;
    doc.setFontSize(14);
    doc.text('3. Alterações Salariais', 14, finalY2);
    
    const salaryChanges = budgetProjections?.raw
      ?.filter((p: any) => p.change_type && !p.is_planned_hire)
      ?.map((p: any) => {
        const currentSalary = p.employee?.salary || 0;
        const newSalary = p.projected_fixed_salary || 0;
        const increase = currentSalary > 0 ? (((newSalary - currentSalary) / currentSalary) * 100).toFixed(1) : '0.0';
        
        return [
          p.employee?.full_name || 'N/A',
          p.change_type || 'N/A',
          `Mês ${p.month}`,
          formatCurrency(currentSalary),
          formatCurrency(newSalary),
          `${increase}%`
        ];
      }) || [];
    
    if (salaryChanges.length > 0) {
      (doc as any).autoTable({
        head: [['Funcionário', 'Tipo', 'Mês', 'Atual', 'Projetado', '% Aumento']],
        body: salaryChanges,
        startY: finalY2 + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [231, 76, 60] },
      });
    } else {
      doc.setFontSize(10);
      doc.text('Nenhuma alteração salarial planejada', 14, finalY2 + 5);
    }
  };

  const generateExcelReport = async (reportType: ReportType) => {
    const XLSX = await import('xlsx');
    
    let workbook: any;
    
    switch (reportType) {
      case 'executive-consolidated':
        workbook = await generateExecutiveConsolidatedExcel(XLSX);
        break;
      case 'payroll-mass':
        workbook = await generatePayrollMassExcel(XLSX);
        break;
      case 'people-analytics':
        workbook = await generatePeopleAnalyticsExcel(XLSX);
        break;
      case 'benefits-incentives':
        workbook = await generateBenefitsIncentivesExcel(XLSX);
        break;
      case 'budget-overview':
        workbook = await generateBudgetOverviewExcel(XLSX);
        break;
      case 'budget-approved-detail':
        // Para Excel, criar planilha simples com todas as projeções
        workbook = XLSX.utils.book_new();
        const projectionsData = [
          ['Funcionário/Nome', 'Unidade', 'Tipo', 'Mês', 'Grade', 'Salário Projetado', 'Justificativa'],
          ...(budgetProjections?.raw?.map((p: any) => [
            p.is_planned_hire ? p.planned_employee_name : p.employee?.full_name,
            p.projected_unit?.description || 'N/A',
            p.is_planned_hire ? 'Contratação' : (p.change_type || 'Manutenção'),
            p.month,
            p.projected_grade || p.employee?.grade || 'N/A',
            p.projected_fixed_salary || 0,
            p.justification || 'Sem justificativa'
          ]) || [])
        ];
        const ws = XLSX.utils.aoa_to_sheet(projectionsData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Projeções Orçamento');
        break;
    }
    
    const fileName = `compsmart_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
