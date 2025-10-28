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
  job_code: string | null;
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

  const parseMonetaryValue = (str: string): number => {
    const cleaned = str.replace(/[^\d,.]/g, '');
    const withoutThousands = cleaned.replace(/\./g, '');
    const normalized = withoutThousands.replace(',', '.');
    return parseFloat(normalized);
  };

  const isHeaderLine = (line: string): boolean => {
    const headerTerms = [
      'codigo', 'código', 'code',
      'titulo', 'título', 'title', 'cargo',
      'grade', 'nivel', 'nível', 'faixa',
      'minimo', 'mínimo', 'min',
      'media', 'média', 'mediana', 'median',
      'maximo', 'máximo', 'max',
      'quartil', 'amplitude'
    ];
    const lowerLine = line.toLowerCase();
    return headerTerms.some(term => lowerLine.includes(term));
  };

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
      
      if (isHeaderLine(line)) {
        console.log(`Linha ${i + 1} ignorada (cabeçalho)`);
        continue;
      }

      const parts = line.split(/[\t;]/).map(p => p.trim());

      try {
        if (parts.length === 4) {
          // SEM CÓDIGO: Título | Grade | Média | Amplitude
          const [title, grade, median, amplitude] = parts;
          
          const medianNum = parseMonetaryValue(median);
          const amplitudeNum = parseFloat(amplitude.replace(',', '.'));

          const { data, error: rpcError } = await supabase.rpc('calculate_salary_range', {
            p_median: medianNum,
            p_amplitude: amplitudeNum,
          });

          if (rpcError) throw rpcError;

          if (data && data.length > 0) {
            rows.push({
              job_code: null,
              job_title: title,
              grade: grade,
              calculation_mode: 'automatic',
              input_median: medianNum,
              input_amplitude: amplitudeNum,
              min_value: data[0].min_value,
              q1_value: data[0].q1_value,
              median_value: data[0].median_value,
              q3_value: data[0].q3_value,
              max_value: data[0].max_value,
            });
          }
        } 
        else if (parts.length === 5) {
          // COM CÓDIGO: Código | Título | Grade | Média | Amplitude
          const [code, title, grade, median, amplitude] = parts;
          
          const medianNum = parseMonetaryValue(median);
          const amplitudeNum = parseFloat(amplitude.replace(',', '.'));

          const { data, error: rpcError } = await supabase.rpc('calculate_salary_range', {
            p_median: medianNum,
            p_amplitude: amplitudeNum,
          });

          if (rpcError) throw rpcError;

          if (data && data.length > 0) {
            rows.push({
              job_code: code,
              job_title: title,
              grade: grade,
              calculation_mode: 'automatic',
              input_median: medianNum,
              input_amplitude: amplitudeNum,
              min_value: data[0].min_value,
              q1_value: data[0].q1_value,
              median_value: data[0].median_value,
              q3_value: data[0].q3_value,
              max_value: data[0].max_value,
            });
          }
        }
        else if (parts.length === 7) {
          // SEM CÓDIGO: Título | Grade | Mín | Q1 | Média | Q3 | Máx
          const [title, grade, min, q1, median, q3, max] = parts;

          rows.push({
            job_code: null,
            job_title: title,
            grade: grade,
            calculation_mode: 'manual',
            min_value: parseMonetaryValue(min),
            q1_value: parseMonetaryValue(q1),
            median_value: parseMonetaryValue(median),
            q3_value: parseMonetaryValue(q3),
            max_value: parseMonetaryValue(max),
          });
        }
        else if (parts.length === 8) {
          // COM CÓDIGO: Código | Título | Grade | Mín | Q1 | Média | Q3 | Máx
          const [code, title, grade, min, q1, median, q3, max] = parts;

          rows.push({
            job_code: code,
            job_title: title,
            grade: grade,
            calculation_mode: 'manual',
            min_value: parseMonetaryValue(min),
            q1_value: parseMonetaryValue(q1),
            median_value: parseMonetaryValue(median),
            q3_value: parseMonetaryValue(q3),
            max_value: parseMonetaryValue(max),
          });
        }
        else {
          throw new Error(`Formato inválido: ${parts.length} colunas`);
        }
      } catch (err: any) {
        setError(
          `❌ Erro na linha ${i + 1}: ${err.message}\n\n` +
          `Formatos aceitos:\n` +
          `• 4 colunas (sem código): Título | Grade | Média | Amplitude\n` +
          `• 5 colunas (com código): Código | Título | Grade | Média | Amplitude\n` +
          `• 7 colunas (sem código): Título | Grade | Mín | Q1 | Média | Q3 | Máx\n` +
          `• 8 colunas (com código): Código | Título | Grade | Mín | Q1 | Média | Q3 | Máx`
        );
        return;
      }
    }

    if (rows.length === 0) {
      setError('Nenhum dado válido encontrado. Verifique se não colou apenas o cabeçalho.');
      return;
    }

    setParsedRows(rows);
    toast({
      title: '✅ Dados analisados',
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

      // ========================================
      // GRUPO 1: Dados COM código (usar upsert)
      // ========================================
      const withCode = dataToInsert.filter(r => r.job_code !== null && r.job_code.trim() !== '');
      
      if (withCode.length > 0) {
        const { error } = await supabase
          .from("survey_data")
          .upsert(withCode, {
            onConflict: "survey_table_id,job_code",
          });
        if (error) throw error;
      }

      // ========================================
      // GRUPO 2: Dados SEM código (verificação manual)
      // ========================================
      const withoutCode = dataToInsert.filter(r => r.job_code === null || r.job_code.trim() === '');
      
      for (const row of withoutCode) {
        // Verificar se já existe baseado em (survey_table_id, job_title, grade)
        const { data: existing, error: selectError } = await supabase
          .from("survey_data")
          .select("id")
          .eq("survey_table_id", row.survey_table_id)
          .eq("job_title", row.job_title)
          .eq("grade", row.grade)
          .is("job_code", null)
          .maybeSingle();

        if (selectError) throw selectError;

        if (existing) {
          // Atualizar registro existente
          const { error: updateError } = await supabase
            .from("survey_data")
            .update(row)
            .eq("id", existing.id);
          if (updateError) throw updateError;
        } else {
          // Inserir novo registro
          const { error: insertError } = await supabase
            .from("survey_data")
            .insert(row);
          if (insertError) throw insertError;
        }
      }

      toast({
        title: "✅ Sucesso",
        description: `${parsedRows.length} cargo(s) importado(s) com sucesso`,
      });

      onSuccess();
      onOpenChange(false);
      setRawData("");
      setParsedRows([]);
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast({
        title: "❌ Erro",
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
              Cole os dados do Excel (use TAB ou ponto-e-vírgula como separador). O código é opcional!
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>• <strong>4 colunas:</strong> Título | Grade | Média | Amplitude</li>
              <li>• <strong>7 colunas:</strong> Título | Grade | Mín | Q1 | Média | Q3 | Máx</li>
              <li>• <strong>5 colunas (com código):</strong> Código | Título | Grade | Média | Amplitude</li>
              <li>• <strong>8 colunas (com código):</strong> Código | Título | Grade | Mín | Q1 | Média | Q3 | Máx</li>
              <li className="text-muted-foreground/70 mt-2">💡 Pode colar com cabeçalho, será ignorado automaticamente</li>
            </ul>
            <Textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Analista Agrícola	3	7.000,00	8.250,00	9.500,00	10.750,00	12.000,00"
              className="min-h-[150px] font-mono text-sm"
            />
            <Button onClick={parseData} className="mt-2" disabled={!rawData.trim()}>
              Analisar Dados
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
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
                      <TableHead>Q1</TableHead>
                      <TableHead>Média</TableHead>
                      <TableHead>Q3</TableHead>
                      <TableHead>Máximo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          {row.job_code || <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                        <TableCell>{row.job_title}</TableCell>
                        <TableCell>{row.grade}</TableCell>
                        <TableCell>{formatCurrency(row.min_value)}</TableCell>
                        <TableCell>{formatCurrency(row.q1_value)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(row.median_value)}</TableCell>
                        <TableCell>{formatCurrency(row.q3_value)}</TableCell>
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
