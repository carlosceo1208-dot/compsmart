import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { calculateSalaryRangePercentage } from "@/lib/salaryCalculations";

interface EmployeeBulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedEmployee {
  full_name: string;
  email: string;
  employee_number?: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  hire_date?: string;
  job_title?: string;
  grade?: string;
  salary?: number;
  variable_salary?: number;
  salary_range_percentage?: number;
  performance_rating?: number;
  unit_code?: string;
  manager_email?: string;
  unit_id?: string | null;
  manager_id?: string | null;
  job_title_id?: string | null;
}

export function EmployeeBulkImport({ open, onOpenChange, onSuccess }: EmployeeBulkImportProps) {
  const { toast } = useToast();
  const [rawData, setRawData] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedEmployee[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const parseMonetaryValue = (value: string): number | undefined => {
    if (!value || value.trim() === "") return undefined;
    const cleaned = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  };

  const detectSeparator = (line: string): string => {
    const tabCount = (line.match(/\t/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;
    const commaCount = (line.match(/,/g) || []).length;
    
    if (tabCount > semicolonCount && tabCount > commaCount) return "\t";
    if (semicolonCount > commaCount) return ";";
    return ",";
  };

  const isHeaderLine = (line: string): boolean => {
    const lowerLine = line.toLowerCase();
    return lowerLine.includes("nome") || lowerLine.includes("email") || lowerLine.includes("cargo");
  };

  const parseData = async () => {
    setLoading(true);
    setErrors([]);
    setParsedRows([]);

    try {
      const lines = rawData.trim().split("\n").filter(l => l.trim() !== "");
      if (lines.length === 0) {
        throw new Error("Nenhum dado fornecido");
      }

      const separator = detectSeparator(lines[0]);
      const startIndex = isHeaderLine(lines[0]) ? 1 : 0;
      const dataLines = lines.slice(startIndex);

      const parsed: ParsedEmployee[] = [];
      const parseErrors: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const columns = line.split(separator).map(c => c.trim());

        if (columns.length < 3) {
          parseErrors.push(`Linha ${i + 1}: Mínimo 3 colunas necessárias (Nome, Email, Unidade)`);
          continue;
        }

        const [
          full_name,
          email,
          employee_number,
          phone,
          cpf,
          birth_date,
          hire_date,
          job_input,
          grade_input,
          salary_str,
          variable_salary_str,
          salary_range_percentage_str,
          performance_rating_str,
          unit_code,
          manager_email
        ] = columns;

        if (!full_name || !email) {
          parseErrors.push(`Linha ${i + 1}: Nome e Email são obrigatórios`);
          continue;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          parseErrors.push(`Linha ${i + 1}: Email inválido`);
          continue;
        }

        // Validar employee_number único se fornecido
        if (employee_number) {
          const { data: existingRE } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("employee_number", employee_number)
            .maybeSingle();
          
          if (existingRE && existingRE.email !== email) {
            parseErrors.push(`Linha ${i + 1}: Número de Registro ${employee_number} já está em uso por ${existingRE.email}`);
            continue;
          }
        }

        // Buscar cargo por código OU nome
        let matchedJob = null;
        let calculatedPercentage = null;
        
        if (job_input) {
          const { data: jobData } = await supabase
            .from("job_titles")
            .select("id, title, code, grade")
            .or(`code.eq.${job_input},title.ilike.%${job_input}%`)
            .limit(1)
            .maybeSingle();
          
          if (!jobData) {
            parseErrors.push(`⚠️ Linha ${i + 1}: Cargo "${job_input}" não encontrado. Funcionário "${full_name}" será importado sem cargo.`);
          } else {
            matchedJob = jobData;
            
            // Validar grade informado com o grade do cargo
            if (grade_input && grade_input !== jobData.grade) {
              parseErrors.push(`⚠️ Linha ${i + 1}: Grade informado "${grade_input}" não corresponde ao Grade "${jobData.grade}" do cargo "${jobData.title}". Será usado o Grade do cargo.`);
            }
            
            // Calcular salary_range_percentage se tiver salário
            const salary = parseMonetaryValue(salary_str);
            if (salary) {
              const paddedGrade = jobData.grade.toString().padStart(3, '0');
              
              // Buscar tabela salarial ativa
              const { data: activeTable } = await supabase
                .from('salary_tables')
                .select('id')
                .eq('is_active', true)
                .maybeSingle();
              
              if (activeTable) {
                const { data: salaryRange } = await supabase
                  .from('salary_ranges')
                  .select('min_value, median_value, max_value')
                  .eq('grade', paddedGrade)
                  .eq('salary_table_id', activeTable.id)
                  .maybeSingle();
                
                if (salaryRange) {
                  calculatedPercentage = calculateSalaryRangePercentage(salary, salaryRange);
                } else {
                  parseErrors.push(`⚠️ Linha ${i + 1}: Faixa salarial não encontrada para Grade ${jobData.grade}. Percentual não será calculado para "${full_name}".`);
                }
              }
            }
          }
        }

        parsed.push({
          full_name,
          email,
          employee_number: employee_number || undefined,
          phone: phone || undefined,
          cpf: cpf || undefined,
          birth_date: birth_date || undefined,
          hire_date: hire_date || undefined,
          job_title: matchedJob?.title || undefined,
          grade: matchedJob?.grade || undefined,
          job_title_id: matchedJob?.id || undefined,
          salary: parseMonetaryValue(salary_str),
          variable_salary: parseMonetaryValue(variable_salary_str),
          salary_range_percentage: calculatedPercentage || undefined,
          performance_rating: parseMonetaryValue(performance_rating_str),
          unit_code: unit_code || undefined,
          manager_email: manager_email || undefined,
        });
      }

      if (parsed.length === 0) {
        throw new Error("Nenhum dado válido encontrado");
      }

      // Buscar unit_ids e manager_ids
      for (const row of parsed) {
        if (row.unit_code) {
          const { data: unitData } = await supabase
            .from("organizational_structure")
            .select("id")
            .eq("code", row.unit_code)
            .maybeSingle();
          row.unit_id = unitData?.id || null;
        }

        if (row.manager_email) {
          const { data: managerData } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", row.manager_email)
            .maybeSingle();
          row.manager_id = managerData?.id || null;
        }
      }

      setParsedRows(parsed);
      setErrors(parseErrors);
      toast({
        title: "Dados analisados",
        description: `${parsed.length} funcionários prontos para importação`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao analisar dados",
        description: error.message,
        variant: "destructive",
      });
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    try {
      for (const row of parsedRows) {
        try {
          const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", row.email)
            .maybeSingle();

          if (existing) {
            // Atualizar existente
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: row.full_name,
            employee_number: row.employee_number || null,
            phone: row.phone || null,
            cpf: row.cpf || null,
            birth_date: row.birth_date || null,
            hire_date: row.hire_date || null,
            job_title: row.job_title || null,
            grade: row.grade || null,
            job_title_id: row.job_title_id || null,
            salary: row.salary || null,
            variable_salary: row.variable_salary || null,
            salary_range_percentage: row.salary_range_percentage || null,
            performance_rating: row.performance_rating || null,
            unit_id: row.unit_id || null,
            manager_id: row.manager_id || null,
          })
          .eq("id", existing.id);

            if (error) throw error;
            results.updated++;
          } else {
            // Criar novo
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: row.email,
              password: "TempPass123!",
              email_confirm: true,
              user_metadata: { full_name: row.full_name },
            });

            if (authError) throw authError;

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: row.full_name,
            employee_number: row.employee_number || null,
            phone: row.phone || null,
            cpf: row.cpf || null,
            birth_date: row.birth_date || null,
            hire_date: row.hire_date || null,
            job_title: row.job_title || null,
            grade: row.grade || null,
            job_title_id: row.job_title_id || null,
            salary: row.salary || null,
            variable_salary: row.variable_salary || null,
            salary_range_percentage: row.salary_range_percentage || null,
            performance_rating: row.performance_rating || null,
            unit_id: row.unit_id || null,
            manager_id: row.manager_id || null,
          })
          .eq("id", authData.user.id);

            if (profileError) throw profileError;
            results.created++;
          }
        } catch (error: any) {
          results.errors.push(`${row.email}: ${error.message}`);
        }
      }

      toast({
        title: "Importação concluída",
        description: `Criados: ${results.created} | Atualizados: ${results.updated} | Erros: ${results.errors.length}`,
      });

      if (results.errors.length > 0) {
        setErrors(results.errors);
      }

      if (results.created > 0 || results.updated > 0) {
        onSuccess();
        if (results.errors.length === 0) {
          onOpenChange(false);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importação em Massa de Funcionários
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
        <strong>Formato Mínimo (3 colunas):</strong> Nome Completo, Email, Código Unidade<br />
              <strong>Formato Completo (15 colunas):</strong> Nome, Email, # Registro, Telefone, CPF, Data Nascimento, <strong>Data Admissão</strong>, <strong>Código ou Nome do Cargo</strong>, Grade (validado automaticamente), Salário Fixo, Salário Variável, % Faixa (calculado automaticamente), Nota Desempenho, Código Unidade, Email Gestor<br />
              <em>Separadores aceitos: TAB, ponto-e-vírgula (;) ou vírgula (,)</em><br />
              <em className="text-xs">💡 O cargo pode ser informado pelo código OU nome. O Grade e % da Faixa são calculados automaticamente.</em>
            </AlertDescription>
          </Alert>

          <Textarea
            placeholder="Cole aqui os dados dos funcionários..."
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />

          <div className="flex gap-2">
            <Button onClick={parseData} disabled={!rawData.trim() || loading}>
              {loading ? "Analisando..." : "Analisar Dados"}
            </Button>
            {parsedRows.length > 0 && (
              <Button onClick={handleImport} disabled={importing} variant="default">
                {importing ? "Importando..." : `Importar ${parsedRows.length} Funcionários`}
              </Button>
            )}
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erros encontrados:</strong>
                <ul className="list-disc list-inside mt-2">
                  {errors.slice(0, 10).map((err, i) => (
                    <li key={i} className="text-xs">{err}</li>
                  ))}
                  {errors.length > 10 && <li className="text-xs">... e mais {errors.length - 10} erros</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Preview ({parsedRows.length} registros)</h3>
                <Badge variant="outline" className="bg-success/10 text-success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Pronto para importar
                </Badge>
              </div>
              <div className="border rounded-lg overflow-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead># Registro</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Unidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.full_name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell className="font-mono text-sm">{row.employee_number || "-"}</TableCell>
                        <TableCell>{row.job_title || "-"}</TableCell>
                        <TableCell>{row.grade || "-"}</TableCell>
                        <TableCell>
                          {row.unit_code || "-"}
                          {row.unit_id && <Badge variant="outline" className="ml-1 text-xs">✓</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {parsedRows.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          ... e mais {parsedRows.length - 10} registros
                        </TableCell>
                      </TableRow>
                    )}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
