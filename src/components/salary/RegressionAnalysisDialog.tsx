import { useState, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FileDown,
  TrendingUp,
  TrendingDown,
  Equal,
  Target,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  calculateLinearRegression,
  compareCurves,
  gradeToNumeric,
  generateRegressionLine,
  type RegressionResult,
  type CurveComparison,
} from "@/lib/regressionCalculations";

interface ComparisonRow {
  grade: string;
  internal_median: number | null;
  survey_median: number | null;
  difference_percent: number | null;
}

interface RegressionAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparisonData: ComparisonRow[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatCompact = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return `R$ ${value.toFixed(0)}`;
};

export function RegressionAnalysisDialog({
  open,
  onOpenChange,
  comparisonData,
}: RegressionAnalysisDialogProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Calcular regressões
  const analysisResults = useMemo(() => {
    // Filtrar dados válidos para cada curva
    const internalData = comparisonData
      .filter((d) => d.internal_median !== null)
      .map((d) => ({
        x: gradeToNumeric(d.grade),
        y: d.internal_median!,
        grade: d.grade,
      }))
      .sort((a, b) => a.x - b.x);

    const marketData = comparisonData
      .filter((d) => d.survey_median !== null)
      .map((d) => ({
        x: gradeToNumeric(d.grade),
        y: d.survey_median!,
        grade: d.grade,
      }))
      .sort((a, b) => a.x - b.x);

    if (internalData.length < 2 || marketData.length < 2) {
      return null;
    }

    // Calcular regressões
    const internalRegression = calculateLinearRegression(
      internalData.map((d) => d.x),
      internalData.map((d) => d.y)
    );

    const marketRegression = calculateLinearRegression(
      marketData.map((d) => d.x),
      marketData.map((d) => d.y)
    );

    // Comparar curvas
    const comparison = compareCurves(internalRegression, marketRegression);

    // Gerar dados para o gráfico de regressão
    const allX = [...internalData.map((d) => d.x), ...marketData.map((d) => d.x)];
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);

    const internalLine = generateRegressionLine(internalRegression, minX, maxX, maxX - minX + 1);
    const marketLine = generateRegressionLine(marketRegression, minX, maxX, maxX - minX + 1);

    // Combinar para o gráfico
    const chartData = internalLine.map((point, i) => ({
      grade: point.x,
      internal_regression: point.y,
      market_regression: marketLine[i]?.y || null,
    }));

    return {
      internalRegression,
      marketRegression,
      comparison,
      chartData,
      internalDataCount: internalData.length,
      marketDataCount: marketData.length,
    };
  }, [comparisonData]);

  const handleExportPDF = async () => {
    if (!analysisResults) return;

    setExporting(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      const doc = new jsPDF();
      const { internalRegression, marketRegression, comparison } = analysisResults;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Análise Regressiva das Curvas Salariais", 20, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        20,
        28
      );

      // Linha separadora
      doc.setDrawColor(200);
      doc.line(20, 32, 190, 32);

      // Seção: Curva Interna
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Curva Interna", 20, 45);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Equação: ${internalRegression.equation}`, 20, 55);
      doc.text(`R² = ${(internalRegression.rSquared * 100).toFixed(1)}%`, 20, 62);
      doc.text(`Inclinação: ${formatCurrency(internalRegression.slope)} por grade`, 20, 69);

      // Seção: Curva de Mercado
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Curva de Mercado", 110, 45);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Equação: ${marketRegression.equation}`, 110, 55);
      doc.text(`R² = ${(marketRegression.rSquared * 100).toFixed(1)}%`, 110, 62);
      doc.text(`Inclinação: ${formatCurrency(marketRegression.slope)} por grade`, 110, 69);

      // Captura do gráfico
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
        });
        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", 20, 80, 170, 85);
      }

      // Análise Comparativa
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Análise Comparativa", 20, 180);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `• Diferença de inclinação: ${comparison.slopeDifferencePercent.toFixed(1)}%`,
        20,
        190
      );

      // Quebrar texto longo
      const interpretationLines = doc.splitTextToSize(
        `• ${comparison.interpretation}`,
        170
      );
      doc.text(interpretationLines, 20, 197);

      if (comparison.intersectionPoint !== null) {
        const yOffset = 197 + interpretationLines.length * 5;
        doc.text(
          `• Ponto de intersecção estimado: Grade ${comparison.intersectionPoint.toFixed(1)}`,
          20,
          yOffset + 7
        );
      }

      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text("CompSmart - Gestão Estratégica de Remuneração", 20, 285);

      doc.save(`Analise_Regressiva_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);

      toast({
        title: "PDF Exportado",
        description: "O relatório foi salvo com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getTrendIcon = (curve: 'internal' | 'market' | 'equal') => {
    switch (curve) {
      case 'internal':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'market':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      default:
        return <Equal className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (!analysisResults) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Análise Regressiva das Curvas Salariais</DialogTitle>
            <DialogDescription>
              Dados insuficientes para análise
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>São necessários pelo menos 2 pontos de dados em cada curva para realizar a análise de regressão.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { internalRegression, marketRegression, comparison, chartData } = analysisResults;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Análise Regressiva das Curvas Salariais
              </DialogTitle>
              <DialogDescription>
                Análise estatística e comparação de tendências salariais
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {exporting ? "Exportando..." : "Exportar PDF"}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Cards de Estatísticas */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Curva Interna */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  Curva Interna
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Equação</p>
                  <p className="font-mono text-lg font-semibold">
                    {internalRegression.equation}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">R² (Ajuste)</p>
                    <p className="text-lg font-semibold">
                      {(internalRegression.rSquared * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inclinação</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(internalRegression.slope)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /grade
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Curva de Mercado */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  Curva de Mercado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Equação</p>
                  <p className="font-mono text-lg font-semibold">
                    {marketRegression.equation}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">R² (Ajuste)</p>
                    <p className="text-lg font-semibold">
                      {(marketRegression.rSquared * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inclinação</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(marketRegression.slope)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /grade
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Regressão */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Linhas de Regressão Linear
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={chartRef} className="bg-background">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="grade"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Grade",
                        position: "insideBottomRight",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      tickFormatter={(value) => formatCompact(value)}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "internal_regression"
                          ? "Regressão Interna"
                          : "Regressão Mercado",
                      ]}
                      labelFormatter={(label) => `Grade: ${label}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "internal_regression"
                          ? "Regressão Interna"
                          : "Regressão Mercado"
                      }
                    />
                    <Line
                      type="linear"
                      dataKey="internal_regression"
                      stroke="hsl(221, 83%, 53%)"
                      strokeWidth={3}
                      dot={false}
                      strokeDasharray="0"
                    />
                    <Line
                      type="linear"
                      dataKey="market_regression"
                      stroke="hsl(25, 95%, 53%)"
                      strokeWidth={3}
                      dot={false}
                      strokeDasharray="0"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Análise Comparativa */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5" />
                Análise Comparativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Diferença de inclinação:
                  </span>
                  <Badge variant="secondary" className="font-mono">
                    {comparison.slopeDifferencePercent.toFixed(1)}%
                  </Badge>
                </div>

                {comparison.intersectionPoint !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Intersecção estimada:
                    </span>
                    <Badge variant="outline" className="font-mono">
                      Grade {comparison.intersectionPoint.toFixed(1)}
                    </Badge>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                {getTrendIcon(comparison.fasterCurve)}
                <p className="text-sm leading-relaxed">{comparison.interpretation}</p>
              </div>

              {/* Legenda de interpretação do R² */}
              <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Interpretação do R²:</p>
                <ul className="space-y-1">
                  <li>• R² {">"} 90%: Excelente ajuste linear</li>
                  <li>• R² 70-90%: Bom ajuste linear</li>
                  <li>• R² {"<"} 70%: Ajuste moderado, considerar análise não-linear</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
