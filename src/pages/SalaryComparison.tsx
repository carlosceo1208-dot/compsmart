import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SalaryTableSelector } from "@/components/SalaryTableSelector";
import { SurveyTableSelector } from "@/components/SurveyTableSelector";
import { ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCompactCurrency } from "@/lib/formatters";

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

const normalizeGrade = (grade: string): string => {
  const cleaned = grade.trim().toUpperCase();
  
  // Tenta extrair número puro (001, 01, 1 → "1")
  const numericMatch = cleaned.match(/^0*(\d+)$/);
  if (numericMatch) {
    return numericMatch[1];
  }
  
  // Se tiver letras (A1, B02), normaliza zeros à esquerda
  const alphanumericMatch = cleaned.match(/^([A-Z]+)0*(\d+)$/);
  if (alphanumericMatch) {
    return `${alphanumericMatch[1]}${alphanumericMatch[2]}`;
  }
  
  return cleaned;
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

      // Combine data by grade (normalized for comparison)
      const salaryMap = new Map(
        salaryData?.map((s) => [normalizeGrade(s.grade), { grade: s.grade, median: s.median_value }]) || []
      );
      const surveyMap = new Map(
        surveyData?.map((s) => [normalizeGrade(s.grade), { grade: s.grade, median: s.median_value }]) || []
      );

      const allNormalizedGrades = new Set([...salaryMap.keys(), ...surveyMap.keys()]);
      const comparison: ComparisonRow[] = [];

      allNormalizedGrades.forEach((normalizedGrade) => {
        const salaryEntry = salaryMap.get(normalizedGrade);
        const surveyEntry = surveyMap.get(normalizedGrade);
        
        const internalMedian = salaryEntry?.median || null;
        const surveyMedian = surveyEntry?.median || null;
        const displayGrade = salaryEntry?.grade || surveyEntry?.grade || normalizedGrade;

        let differencePercent = null;
        if (internalMedian && surveyMedian && surveyMedian !== 0) {
          differencePercent = ((internalMedian - surveyMedian) / surveyMedian) * 100;
        }

        comparison.push({
          grade: displayGrade,
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
        <>
          {/* Gráfico de Linhas Comparativo */}
          <Card>
            <CardHeader>
              <CardTitle>Curva Comparativa de Medianas</CardTitle>
              <CardDescription>
                Visualização gráfica da comparação por grade/nível
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : comparisonData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center">
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="grade" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCompactCurrency(value)}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Grade: ${label}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="internal_median" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Tabela Interna"
                      connectNulls
                    />
                    <Line 
                      type="monotone" 
                      dataKey="survey_median" 
                      stroke="hsl(25, 95%, 53%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(25, 95%, 53%)', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Pesquisa de Mercado"
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Tabela Comparativa */}
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
        </>
      )}
    </div>
  );
}
