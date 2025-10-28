import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SalaryTableSelector } from "@/components/SalaryTableSelector";
import { SurveyTableSelector } from "@/components/SurveyTableSelector";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ComparisonRow {
  grade: string;
  internal_median: number | null;
  survey_median: number | null;
  difference_percent: number | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

export default function SalaryComparison() {
  const { toast } = useToast();
  const [salaryTableId, setSalaryTableId] = useState<string | undefined>();
  const [surveyTableId, setSurveyTableId] = useState<string | undefined>();
  const [comparisonData, setComparisonData] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (salaryTableId && surveyTableId) {
      fetchComparisonData();
    } else {
      setComparisonData([]);
    }
  }, [salaryTableId, surveyTableId]);

  const fetchComparisonData = async () => {
    if (!salaryTableId || !surveyTableId) return;

    setLoading(true);
    try {
      // Fetch internal salary data
      const { data: salaryData, error: salaryError } = await supabase
        .from("salary_ranges")
        .select("grade, median_value")
        .eq("salary_table_id", salaryTableId);

      if (salaryError) throw salaryError;

      // Fetch survey data
      const { data: surveyData, error: surveyError } = await supabase
        .from("survey_data")
        .select("grade, median_value")
        .eq("survey_table_id", surveyTableId);

      if (surveyError) throw surveyError;

      // Combine data by grade
      const salaryMap = new Map(salaryData?.map((s) => [s.grade, s.median_value]) || []);
      const surveyMap = new Map(surveyData?.map((s) => [s.grade, s.median_value]) || []);

      const allGrades = new Set([...salaryMap.keys(), ...surveyMap.keys()]);
      const comparison: ComparisonRow[] = [];

      allGrades.forEach((grade) => {
        const internalMedian = salaryMap.get(grade) || null;
        const surveyMedian = surveyMap.get(grade) || null;

        let differencePercent = null;
        if (internalMedian && surveyMedian && surveyMedian !== 0) {
          differencePercent = ((internalMedian - surveyMedian) / surveyMedian) * 100;
        }

        comparison.push({
          grade,
          internal_median: internalMedian,
          survey_median: surveyMedian,
          difference_percent: differencePercent,
        });
      });

      // Sort by grade (numeric if possible, otherwise alphabetic)
      comparison.sort((a, b) => {
        const aNum = parseFloat(a.grade);
        const bNum = parseFloat(b.grade);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.grade.localeCompare(b.grade);
      });

      setComparisonData(comparison);
    } catch (error: any) {
      console.error("Error fetching comparison data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de comparação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifferenceColor = (diff: number | null) => {
    if (diff === null) return "text-muted-foreground";
    if (diff > 0) return "text-blue-600 dark:text-blue-400";
    if (diff < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const getDifferenceIcon = (diff: number | null) => {
    if (diff === null) return null;
    if (diff > 0) return <ArrowUp className="h-4 w-4 inline" />;
    if (diff < 0) return <ArrowDown className="h-4 w-4 inline" />;
    return null;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comparação Salarial</h1>
        <p className="text-muted-foreground mt-2">
          Compare sua tabela salarial interna com pesquisas de mercado
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tabela Interna</CardTitle>
            <CardDescription>
              Selecione a tabela salarial da empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalaryTableSelector
              value={salaryTableId}
              onChange={setSalaryTableId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesquisa de Mercado</CardTitle>
            <CardDescription>
              Selecione a pesquisa salarial para comparação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SurveyTableSelector
              value={surveyTableId}
              onChange={setSurveyTableId}
            />
          </CardContent>
        </Card>
      </div>

      {salaryTableId && surveyTableId && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação por Grade</CardTitle>
            <CardDescription>
              Análise comparativa dos pontos médios por grade/nível
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : comparisonData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado disponível para comparação
              </p>
            ) : (
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade/Nível</TableHead>
                      <TableHead className="text-right">Média Interna</TableHead>
                      <TableHead className="text-right">Média Mercado</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row) => (
                      <TableRow key={row.grade}>
                        <TableCell className="font-semibold">{row.grade}</TableCell>
                        <TableCell className="text-right">
                          {row.internal_median !== null
                            ? formatCurrency(row.internal_median)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.survey_median !== null
                            ? formatCurrency(row.survey_median)
                            : "N/A"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${getDifferenceColor(row.difference_percent)}`}
                        >
                          {row.difference_percent !== null ? (
                            <span className="flex items-center justify-end gap-1">
                              {getDifferenceIcon(row.difference_percent)}
                              {formatPercent(row.difference_percent)}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.difference_percent !== null ? (
                            <Badge
                              variant={row.difference_percent >= 0 ? "default" : "destructive"}
                            >
                              {row.difference_percent >= 0 ? "Acima" : "Abaixo"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">N/A</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
