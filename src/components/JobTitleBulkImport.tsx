import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface JobTitleBulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedRow {
  code: string | null;
  job_family: string;
  title: string;
  grade: string;
  cbo: string;
  is_active: boolean;
  median_points: number;
}

// Job families are now managed dynamically in the database

const familyColors: Record<string, string> = {
  'Analistas': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Profissionais': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Consultores': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Especialistas': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Coordenadores': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'Supervisores': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Gerentes': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'Executivos - Diretores': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Lideres-Projetos': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

export function JobTitleBulkImport({ open, onOpenChange, onSuccess }: JobTitleBulkImportProps) {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseData = async () => {
    try {
      setError(null);
      const lines = rawData.trim().split('\n');
      
      if (lines.length === 0) {
        setError("Nenhum dado para importar");
        return;
      }

      const parsed: ParsedRow[] = [];
      let startIndex = 0;

      // Auto-detect header
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('família') || firstLine.includes('titulo') || firstLine.includes('código')) {
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Try different separators: TAB, semicolon, pipe
        let parts = line.split('\t');
        if (parts.length < 5) parts = line.split(';');
        if (parts.length < 5) parts = line.split('|');

        if (parts.length < 5) {
          setError(`Linha ${i + 1}: formato inválido. Esperado 5 ou 6 colunas.`);
          return;
        }

        let code: string | null = null;
        let job_family: string;
        let title: string;
        let grade: string;
        let cbo: string;
        let is_active = true; // Default to active

        // Detect format based on column count and content
        if (parts.length >= 6) {
          // 6 columns: Código | Família | Título | Grade | CBO | Ativo
          const [codeCol, familyCol, titleCol, gradeCol, cboCol, activeCol] = parts.map(p => p.trim());
          code = codeCol;
          job_family = familyCol;
          title = titleCol;
          grade = gradeCol;
          cbo = cboCol;
          is_active = ['sim', 'ativo', 's', 'true', '1'].includes(activeCol.toLowerCase());
        } else if (parts.length === 5) {
          // Check if 2nd column is numeric (code) or if 5th is status text
          const secondCol = parts[1].trim();
          const fifthCol = parts[4].trim();
          
          const isSecondColNumeric = /^\d+$/.test(secondCol);
          const isFifthColStatus = /^(sim|não|ativo|inativo|s|n|true|false|1|0)$/i.test(fifthCol);
          
          if (isSecondColNumeric && !isFifthColStatus) {
            // Format: Família | Código | Título | Grade | CBO (without status)
            [job_family, code, title, grade, cbo] = parts.map(p => p.trim());
            is_active = true; // Default to active
          } else {
            // Format: Família | Título | Grade | CBO | Ativo
            const [familyCol, titleCol, gradeCol, cboCol, activeCol] = parts.map(p => p.trim());
            job_family = familyCol;
            title = titleCol;
            grade = gradeCol;
            cbo = cboCol;
            is_active = ['sim', 'ativo', 's', 'true', '1'].includes(activeCol.toLowerCase());
          }
        }

        // Job family validation removed - will be created automatically if doesn't exist

        // Validate CBO format (XXXX-XX)
        if (!/^\d{4}-\d{2}$/.test(cbo)) {
          setError(`Linha ${i + 1}: CBO "${cbo}" inválido. Formato esperado: XXXX-XX`);
          return;
        }

        parsed.push({
          code: code || null,
          job_family,
          title,
          grade,
          cbo,
          is_active,
          median_points: 0
        });
      }

      setParsedRows(parsed);
      toast.success(`${parsed.length} cargos prontos para importar`);
    } catch (err: any) {
      console.error('Parse error:', err);
      setError(err.message || "Erro ao processar dados");
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }

    setLoading(true);
    try {
      // First, ensure all job families exist
      const uniqueFamilies = [...new Set(parsedRows.map(row => row.job_family))];
      
      const { data: existingFamilies } = await supabase
        .from('job_families')
        .select('name');
      
      const existingFamilyNames = existingFamilies?.map(f => f.name) || [];
      const newFamilies = uniqueFamilies.filter(f => !existingFamilyNames.includes(f));
      
      if (newFamilies.length > 0) {
        const { error: familyError } = await supabase
          .from('job_families')
          .insert(
            newFamilies.map((name, index) => ({
              name,
              color_class: [
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
              ][index % 3]
            }))
          );
        
        if (familyError) {
          console.error('Erro ao criar famílias:', familyError);
          toast.error('Erro ao criar novas famílias de cargos');
          setLoading(false);
          return;
        }
        
        toast.success(`${newFamilies.length} nova(s) família(s) criada(s): ${newFamilies.join(', ')}`);
      }

      // Separate rows with code and without code
      const rowsWithCode = parsedRows.filter(row => row.code);
      const rowsWithoutCode = parsedRows.filter(row => !row.code);

      let insertedCount = 0;
      let updatedCount = 0;

      // Import rows with code using upsert
      if (rowsWithCode.length > 0) {
        const { data: upsertedData, error: upsertError } = await supabase
          .from('job_titles')
          .upsert(rowsWithCode, {
            onConflict: 'code',
            ignoreDuplicates: false
          })
          .select();

        if (upsertError) throw upsertError;
        if (upsertedData) insertedCount += upsertedData.length;
      }

      // Import rows without code - check for existing by (title, grade)
      for (const row of rowsWithoutCode) {
        const { data: existing, error: searchError } = await supabase
          .from('job_titles')
          .select('id, code, title, grade, cbo, is_active')
          .eq('title', row.title)
          .eq('grade', row.grade)
          .maybeSingle();

        if (searchError) throw searchError;

        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('job_titles')
            .update({
              cbo: row.cbo,
              is_active: row.is_active
            } as any)
            .eq('id', existing.id);

          if (updateError) throw updateError;
          updatedCount++;
        } else {
          // Insert new (without code)
          const { error: insertError } = await supabase
            .from('job_titles')
            .insert({
              title: row.title,
              grade: row.grade,
              cbo: row.cbo,
              is_active: row.is_active,
              median_points: 0
            } as any);

          if (insertError) throw insertError;
          insertedCount++;
        }
      }

      toast.success(`Importação concluída: ${insertedCount} novos, ${updatedCount} atualizados`);
      onSuccess();
      onOpenChange(false);
      setRawData("");
      setParsedRows([]);
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || "Erro ao importar cargos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importação em Massa de Cargos</DialogTitle>
          <DialogDescription>
            Cole os dados do Excel com as colunas:<br />
            • <strong>Família | Código | Título | Grade | CBO</strong> (status padrão: Ativo)<br />
            • <strong>Família | Título | Grade | CBO | Ativo</strong><br />
            • <strong>Código | Família | Título | Grade | CBO | Ativo</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Cole aqui os dados do Excel (ex: Analistas	009	Analista Agrícola	3	2132-10)"
              className="min-h-[150px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Formato CBO: XXXX-XX | Novas famílias serão criadas automaticamente
            </p>
          </div>

          <Button onClick={parseData} disabled={!rawData.trim() || loading}>
            Analisar Dados
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parsedRows.length > 0 && (
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-muted/50">
                <h4 className="font-semibold">Preview ({parsedRows.length} cargos)</h4>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Família</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>CBO</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">
                          {row.code || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={familyColors[row.job_family]}>
                            {row.job_family}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{row.title}</TableCell>
                        <TableCell>{row.grade}</TableCell>
                        <TableCell className="font-mono text-xs">{row.cbo}</TableCell>
                        <TableCell>
                          <Badge variant={row.is_active ? "success" : "destructive"}>
                            {row.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
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
            {loading ? "Importando..." : `Importar ${parsedRows.length} Cargos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}