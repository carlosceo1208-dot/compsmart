import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Save,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { IMPORT_FIELDS, type ColumnMapping } from '@/lib/employeeImport/fieldCatalog';
import {
  parsePastedText,
  parseSpreadsheet,
  type ParsedSheet,
} from '@/lib/employeeImport/parseSpreadsheet';
import { suggestMappingLocal, suggestMappingWithAI } from '@/lib/employeeImport/suggestMapping';
import { validateRows, type ValidationSummary } from '@/lib/employeeImport/validateRows';
import {
  useImportLookups,
  useRunImport,
  useSaveMapping,
  useSavedMappings,
  type DuplicateStrategy,
  type ImportResultSummary,
} from '@/hooks/useEmployeeImport';

type Step = 'file' | 'mapping' | 'preview' | 'result';

const NONE = '__none__';

const STRATEGY_OPTIONS: { value: DuplicateStrategy; label: string; hint: string }[] = [
  {
    value: 'update',
    label: 'Atualizar existentes',
    hint: 'A folha é a fonte da verdade: atualiza apenas os campos mapeados.',
  },
  {
    value: 'ignore',
    label: 'Ignorar existentes',
    hint: 'Insere somente novos; os existentes ficam intactos e aparecem no log.',
  },
  {
    value: 'only_new',
    label: 'Somente novos',
    hint: 'Insere somente novos, sem registrar os existentes no log.',
  },
];

interface Props {
  onImported: () => void;
  onClose: () => void;
  onViewHistory: () => void;
}

export function EmployeeImportWizard({ onImported, onClose, onViewHistory }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('file');
  const [parsed, setParsed] = useState<ParsedSheet | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [sourceSystem, setSourceSystem] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [strategy, setStrategy] = useState<DuplicateStrategy>('update');
  const [mappingName, setMappingName] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ImportResultSummary | null>(null);

  const lookupsQuery = useImportLookups(step === 'preview' || step === 'mapping');
  const savedMappings = useSavedMappings();
  const saveMapping = useSaveMapping();
  const runImport = useRunImport();

  const validation: ValidationSummary | null = useMemo(() => {
    if (!parsed || !lookupsQuery.data) return null;
    return validateRows(parsed.rows, mapping, lookupsQuery.data);
  }, [parsed, mapping, lookupsQuery.data]);

  const applySuggestion = async (sheet: ParsedSheet) => {
    const local = suggestMappingLocal(sheet.headers);
    setMapping(local);
    setSuggesting(true);
    const { mapping: withAI, aiUsed } = await suggestMappingWithAI(sheet.headers, local);
    setMapping(withAI);
    setSuggesting(false);
    if (aiUsed) {
      toast({
        title: 'Mapeamento sugerido com apoio da IA',
        description: 'Revise as correspondências antes de continuar.',
      });
    }
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const sheet = await parseSpreadsheet(file);
      setParsed(sheet);
      setSourceFile(file);
      setFileName(file.name);
      await applySuggestion(sheet);
      setStep('mapping');
    } catch (error) {
      toast({
        title: 'Não foi possível ler o arquivo',
        description: error instanceof Error ? error.message : 'Arquivo inválido',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const handlePaste = async () => {
    setParsing(true);
    try {
      const sheet = parsePastedText(pastedText);
      setParsed(sheet);
      setFileName('Dados colados');
      await applySuggestion(sheet);
      setStep('mapping');
    } catch (error) {
      toast({
        title: 'Não foi possível ler os dados',
        description: error instanceof Error ? error.message : 'Dados inválidos',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!sourceFile) return;
    setParsing(true);
    try {
      const sheet = await parseSpreadsheet(sourceFile, sheetName);
      setParsed(sheet);
      await applySuggestion(sheet);
    } catch (error) {
      toast({
        title: 'Não foi possível ler a aba',
        description: error instanceof Error ? error.message : 'Aba inválida',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const usedColumns = new Set(Object.values(mapping).filter(Boolean) as string[]);
  const identifierMapped = !!mapping.employee_number || !!mapping.cpf;
  const nameMapped = !!mapping.full_name;

  const handleImport = async () => {
    if (!validation || !parsed) return;
    try {
      const summary = await runImport.mutateAsync({
        fileName,
        sheetName: parsed.sheetName,
        sourceSystem: sourceSystem.trim() || null,
        strategy,
        mapping,
        rows: validation.rows,
      });
      setResult(summary);
      setStep('result');
      onImported();
    } catch (error) {
      toast({
        title: 'Importação não concluída',
        description:
          error instanceof Error
            ? error.message
            : 'Nada foi gravado. Nenhum dado parcial ficou na base.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveMapping = async () => {
    if (!mappingName.trim()) return;
    try {
      await saveMapping.mutateAsync({
        name: mappingName.trim(),
        sourceSystem: sourceSystem.trim() || null,
        mapping,
      });
      toast({ title: 'Mapeamento salvo', description: mappingName.trim() });
      setMappingName('');
    } catch (error) {
      toast({
        title: 'Não foi possível salvar o mapeamento',
        description: error instanceof Error ? error.message : 'Erro inesperado',
        variant: 'destructive',
      });
    }
  };

  /* ------------------------------ Passo 1: arquivo ----------------------------- */
  if (step === 'file') {
    return (
      <div className="space-y-4">
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertDescription>
            Envie a planilha exportada do seu sistema de folha (.xlsx, .xls ou .csv). A plataforma
            <strong> importa a base de colaboradores</strong> — não processa folha de pagamento. As
            colunas podem ter qualquer nome: você indica a correspondência no passo seguinte.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="arquivo">
          <TabsList>
            <TabsTrigger value="arquivo">Arquivo da folha</TabsTrigger>
            <TabsTrigger value="colar">Colar dados</TabsTrigger>
          </TabsList>

          <TabsContent value="arquivo" className="space-y-4 pt-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition hover:bg-muted/60">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="font-medium">Escolher planilha</span>
              <span className="text-sm text-muted-foreground">
                TOTVS, Senior, Domínio, ADP e outros sistemas de folha
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  event.target.value = '';
                }}
              />
            </label>
            <div className="space-y-2">
              <Label htmlFor="source-system">Sistema de origem (opcional)</Label>
              <Input
                id="source-system"
                placeholder="Ex.: TOTVS RM, Senior HCM, Domínio"
                value={sourceSystem}
                onChange={(event) => setSourceSystem(event.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="colar" className="space-y-3 pt-4">
            <Textarea
              rows={8}
              className="font-mono text-sm"
              placeholder="Cole aqui as linhas da planilha (com a linha de cabeçalho)..."
              value={pastedText}
              onChange={(event) => setPastedText(event.target.value)}
            />
            <Button onClick={handlePaste} disabled={!pastedText.trim() || parsing}>
              {parsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continuar
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onViewHistory}>
            Ver histórico de importações
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  /* ----------------------------- Passo 2: mapeamento --------------------------- */
  if (step === 'mapping' && parsed) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{fileName}</p>
            <p className="text-sm text-muted-foreground">
              {parsed.rows.length} linhas · {parsed.headers.length} colunas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {parsed.sheetNames.length > 1 && (
              <Select value={parsed.sheetName} onValueChange={handleSheetChange}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Aba" />
                </SelectTrigger>
                <SelectContent>
                  {parsed.sheetNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {savedMappings.data && savedMappings.data.length > 0 && (
              <Select
                onValueChange={(id) => {
                  const saved = savedMappings.data?.find((m) => m.id === id);
                  if (saved) setMapping({ ...suggestMappingLocal(parsed.headers), ...saved.mapping });
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Usar mapeamento salvo" />
                </SelectTrigger>
                <SelectContent>
                  {savedMappings.data.map((saved) => (
                    <SelectItem key={saved.id} value={saved.id}>
                      {saved.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void applySuggestion(parsed)}
              disabled={suggesting}
            >
              {suggesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Sugerir novamente
            </Button>
          </div>
        </div>

        {(!identifierMapped || !nameMapped) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Mapeie o <strong>Nome completo</strong> e ao menos <strong>Matrícula ou CPF</strong>{' '}
              para continuar.
            </AlertDescription>
          </Alert>
        )}

        <div className="max-h-[45vh] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo da plataforma</TableHead>
                <TableHead>Coluna da planilha</TableHead>
                <TableHead>Exemplo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {IMPORT_FIELDS.map((field) => {
                const selected = mapping[field.key] ?? null;
                const sample = selected ? parsed.rows[0]?.[selected] : '';
                return (
                  <TableRow key={field.key}>
                    <TableCell>
                      <div className="font-medium">{field.label}</div>
                      {field.hint && (
                        <div className="text-xs text-muted-foreground">{field.hint}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selected ?? NONE}
                        onValueChange={(value) =>
                          setMapping((prev) => ({
                            ...prev,
                            [field.key]: value === NONE ? null : value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-60">
                          <SelectValue placeholder="Não importar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Não importar</SelectItem>
                          {parsed.headers.map((header) => (
                            <SelectItem
                              key={header}
                              value={header}
                              disabled={usedColumns.has(header) && header !== selected}
                            >
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                      {sample || '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="mapping-name">Salvar este mapeamento como</Label>
            <Input
              id="mapping-name"
              placeholder="Ex.: Folha TOTVS mensal"
              value={mappingName}
              onChange={(event) => setMappingName(event.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleSaveMapping}
            disabled={!mappingName.trim() || saveMapping.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('file')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={() => setStep('preview')} disabled={!identifierMapped || !nameMapped}>
            Validar e revisar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------ Passo 3: preview ----------------------------- */
  if (step === 'preview' && parsed) {
    if (lookupsQuery.isLoading || !validation) {
      return (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Validando as linhas...
        </div>
      );
    }

    const invalidRows = validation.rows.filter((row) => !row.valid);
    const validRows = validation.rows.filter((row) => row.valid);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: 'Linhas', value: validation.total },
            { label: 'Válidas', value: validation.validCount },
            { label: 'Com erro', value: validation.errorCount },
            { label: 'Novas', value: validation.newCount },
            { label: 'Já existentes', value: validation.existingCount },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-2xl border p-4">
          <Label>Colaboradores que já existem na plataforma</Label>
          <RadioGroup
            value={strategy}
            onValueChange={(value) => setStrategy(value as DuplicateStrategy)}
            className="gap-3"
          >
            {STRATEGY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-start gap-2">
                <RadioGroupItem value={option.value} id={`strategy-${option.value}`} />
                <Label htmlFor={`strategy-${option.value}`} className="font-normal">
                  <span className="font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Tabs defaultValue="validas">
          <TabsList>
            <TabsTrigger value="validas">Válidas ({validRows.length})</TabsTrigger>
            <TabsTrigger value="erros">Com erro ({invalidRows.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="validas" className="pt-3">
            <div className="max-h-64 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validRows.slice(0, 50).map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.fields.employee_number ?? '—'}
                      </TableCell>
                      <TableCell>{row.fields.full_name ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{row.fields.cpf ?? '—'}</TableCell>
                      <TableCell>{row.fields.job_title ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {row.existsInPlatform ? 'Já existe' : 'Novo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {validRows.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        ... e mais {validRows.length - 50} linhas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="erros" className="pt-3">
            {invalidRows.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Nenhuma linha com erro.</AlertDescription>
              </Alert>
            ) : (
              <div className="max-h-64 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invalidRows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
                        <TableCell className="text-sm">
                          {row.issues
                            .filter((issue) => issue.severity === 'error')
                            .map((issue) => issue.message)
                            .join(' · ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {validation.warningCount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validation.warningCount} linha(s) com avisos (cargo, unidade ou gestor não
              encontrados). Serão importadas sem esses vínculos.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('mapping')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ajustar mapeamento
          </Button>
          <Button onClick={handleImport} disabled={validation.validCount === 0 || runImport.isPending}>
            {runImport.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Importar {validation.validCount} linha(s)
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------ Passo 4: resultado --------------------------- */
  return (
    <div className="space-y-4">
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>Importação concluída.</AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Importadas', value: result?.imported ?? 0 },
          { label: 'Atualizadas', value: result?.updated ?? 0 },
          { label: 'Ignoradas', value: result?.ignored ?? 0 },
          { label: 'Com erro', value: result?.errors ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={onViewHistory}>
          Ver log desta importação
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setParsed(null);
              setResult(null);
              setPastedText('');
              setStep('file');
            }}
          >
            Nova importação
          </Button>
          <Button onClick={onClose}>Concluir</Button>
        </div>
      </div>
    </div>
  );
}
