import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SalaryBulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salaryTableId: string;
  onSuccess: () => void;
}

interface ParsedRow {
  grade: string;
  median: number;
  min: number;
  q1: number;
  q3: number;
  max: number;
}

export function SalaryBulkImport({ open, onOpenChange, salaryTableId, onSuccess }: SalaryBulkImportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseData = async () => {
    setError(null);
    setParsedRows([]);

    try {
      const lines = rawData.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setError('Nenhum dado para processar');
        return;
      }

      const rows: ParsedRow[] = [];

      for (const line of lines) {
        // Aceita separadores: tab, ponto-e-vírgula, vírgula
        const parts = line.split(/[\t;,]/).map(p => p.trim());
        
        if (parts.length < 2) {
          setError(`Linha inválida: "${line}". Formato esperado: GRADE[TAB]VALOR`);
          return;
        }

        const grade = parts[0];
        const medianStr = parts[1].replace(/\./g, '').replace(',', '.');
        const median = parseFloat(medianStr);

        if (isNaN(median)) {
          setError(`Valor inválido na linha: "${line}"`);
          return;
        }

        // Calcular valores usando a lógica fixa (-20% / +25%)
        const { data, error: rpcError } = await supabase
          .rpc('calculate_salary_range_fixed', { p_median: median });

        if (rpcError) throw rpcError;

        if (data && data.length > 0) {
          const calc = data[0];
          rows.push({
            grade,
            median,
            min: calc.min_value,
            q1: calc.q1_value,
            q3: calc.q3_value,
            max: calc.max_value,
          });
        }
      }

      setParsedRows(rows);
    } catch (err: any) {
      console.error('Error parsing data:', err);
      setError(err.message || 'Erro ao processar dados');
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum dado para importar',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const insertData = parsedRows.map(row => ({
        salary_table_id: salaryTableId,
        grade: row.grade,
        calculation_mode: 'automatic' as const,
        min_value: row.min,
        q1_value: row.q1,
        median_value: row.median,
        q3_value: row.q3,
        max_value: row.max,
      }));

      const { error } = await supabase
        .from('salary_ranges')
        .upsert(insertData, {
          onConflict: 'salary_table_id,grade',
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${parsedRows.length} faixas salariais importadas com sucesso`,
      });

      onSuccess();
      onOpenChange(false);
      setRawData('');
      setParsedRows([]);
    } catch (err: any) {
      console.error('Error importing data:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Não foi possível importar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importação em Massa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Cole os dados da planilha (Grade e Ponto Médio) separados por TAB ou ponto-e-vírgula:
            </p>
            <Textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="001	7000,00
002	7932,00
003	8989,00"
              className="font-mono text-sm min-h-[150px]"
            />
            <Button onClick={parseData} disabled={!rawData.trim()}>
              Processar Dados
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Preview: {parsedRows.length} faixas calculadas
              </p>
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead className="text-right">Q1</TableHead>
                      <TableHead className="text-right">Média de Mercado</TableHead>
                      <TableHead className="text-right">Q3</TableHead>
                      <TableHead className="text-right">Máximo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">{row.grade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.min)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.q1)}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(row.median)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.q3)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.max)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || parsedRows.length === 0}
          >
            {loading ? 'Importando...' : `Importar ${parsedRows.length} Faixas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
