import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

interface SurveyBulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyTableId: string;
  onSuccess: () => void;
}

interface ParsedRow {
  job_code: string;
  job_title: string;
  grade: string;
  calculation_mode: "manual" | "automatic";
  input_median?: number;
  input_amplitude?: number;
  min_value: number;
  q1_value: number;
  median_value: number;
  q3_value: number;
  max_value: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function SurveyBulkImport({
  open,
  onOpenChange,
  surveyTableId,
  onSuccess,
}: SurveyBulkImportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseData = async () => {
    setError(null);
    setParsedRows([]);

    if (!rawData.trim()) {
      setError("Cole os dados para importar");
      return;
    }

    const lines = rawData.trim().split("\n");
    const rows: ParsedRow[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split("\t").map((p) => p.trim());

      if (parts.length === 5) {
        // Format: Code | Title | Grade | Median | Amplitude
        const [code, title, grade, median, amplitude] = parts;

        try {
          const medianNum = parseFloat(median.replace(/[^\d,.-]/g, "").replace(",", "."));
          const amplitudeNum = parseFloat(amplitude.replace(/[^\d,.-]/g, "").replace(",", "."));

          // Calculate range using Supabase function
          const { data, error } = await supabase.rpc("calculate_salary_range", {
            p_median: medianNum,
            p_amplitude: amplitudeNum,
          });

          if (error) throw error;

          if (data && data.length > 0) {
            rows.push({
              job_code: code,
              job_title: title,
              grade: grade,
              calculation_mode: "automatic",
              input_median: medianNum,
              input_amplitude: amplitudeNum,
              ...data[0],
            });
          }
        } catch (err) {
          setError(`Erro na linha ${i + 1}: valores inválidos`);
          return;
        }
      } else if (parts.length === 8) {
        // Format: Code | Title | Grade | Min | Q1 | Median | Q3 | Max
        const [code, title, grade, min, q1, median, q3, max] = parts;

        try {
          rows.push({
            job_code: code,
            job_title: title,
            grade: grade,
            calculation_mode: "manual",
            min_value: parseFloat(min.replace(/[^\d,.-]/g, "").replace(",", ".")),
            q1_value: parseFloat(q1.replace(/[^\d,.-]/g, "").replace(",", ".")),
            median_value: parseFloat(median.replace(/[^\d,.-]/g, "").replace(",", ".")),
            q3_value: parseFloat(q3.replace(/[^\d,.-]/g, "").replace(",", ".")),
            max_value: parseFloat(max.replace(/[^\d,.-]/g, "").replace(",", ".")),
          });
        } catch (err) {
          setError(`Erro na linha ${i + 1}: valores inválidos`);
          return;
        }
      } else {
        setError(
          `Formato inválido na linha ${i + 1}. Use:\n` +
            "- 5 colunas: Código | Título | Grade | Média | Amplitude\n" +
            "- 8 colunas: Código | Título | Grade | Mín | Q1 | Média | Q3 | Máx"
        );
        return;
      }
    }

    if (rows.length === 0) {
      setError("Nenhum dado válido encontrado");
      return;
    }

    setParsedRows(rows);
    toast({
      title: "Dados analisados",
      description: `${rows.length} cargo(s) pronto(s) para importar`,
    });
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setLoading(true);
    try {
      const dataToInsert = parsedRows.map((row) => ({
        survey_table_id: surveyTableId,
        ...row,
      }));

      const { error } = await supabase
        .from("survey_data")
        .upsert(dataToInsert, {
          onConflict: "survey_table_id,job_code",
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${parsedRows.length} cargo(s) importado(s) com sucesso`,
      });

      onSuccess();
      onOpenChange(false);
      setRawData("");
      setParsedRows([]);
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao importar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importação em Massa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Cole os dados do Excel (separados por tabulação) em um dos formatos:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>• <strong>Formato 1 (5 colunas):</strong> Código | Título | Grade | Média | Amplitude</li>
              <li>• <strong>Formato 2 (8 colunas):</strong> Código | Título | Grade | Mín | Q1 | Média | Q3 | Máx</li>
            </ul>
            <Textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Cole aqui os dados do Excel..."
              className="min-h-[150px] font-mono text-sm"
            />
            <Button onClick={parseData} className="mt-2" disabled={!rawData.trim()}>
              Analisar Dados
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parsedRows.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Preview ({parsedRows.length} cargo(s))</h3>
              <div className="border rounded-lg max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Mínimo</TableHead>
                      <TableHead>Média</TableHead>
                      <TableHead>Máximo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{row.job_code}</TableCell>
                        <TableCell>{row.job_title}</TableCell>
                        <TableCell>{row.grade}</TableCell>
                        <TableCell>{formatCurrency(row.min_value)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(row.median_value)}</TableCell>
                        <TableCell>{formatCurrency(row.max_value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedRows.length === 0 || loading}
          >
            {loading ? "Importando..." : `Importar ${parsedRows.length} cargo(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
