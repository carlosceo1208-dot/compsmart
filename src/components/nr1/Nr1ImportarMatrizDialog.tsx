import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Info, ArrowRight, CheckCircle2, X, AlertCircle, FileText, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { z } from 'zod';
import * as XLSX from 'xlsx';

type Metodologia = 'COPSOQ-III' | 'HSE' | 'JCQ' | 'ERI' | 'OUTRA';

const METODOLOGIAS: Array<{ id: Metodologia; nome: string; origem: string; fatores: string; descricao: string }> = [
  { id: 'COPSOQ-III', nome: 'COPSOQ-III', origem: 'Dinamarca (padrão CompSmart)', fatores: '13 fatores', descricao: 'Copenhagen Psychosocial Questionnaire — referência ISO 45003 / NR-1.' },
  { id: 'HSE', nome: 'HSE Indicator Tool', origem: 'Reino Unido (Health & Safety Executive)', fatores: '7 dimensões', descricao: 'Demands, Control, Support, Relationships, Role, Change, Peer Support.' },
  { id: 'JCQ', nome: 'JCQ (Karasek)', origem: 'Modelo Demanda-Controle', fatores: '3 eixos', descricao: 'Demanda Psicológica, Controle/Latitude de Decisão, Suporte Social.' },
  { id: 'ERI', nome: 'ERI (Siegrist)', origem: 'Desequilíbrio Esforço-Recompensa', fatores: '3 eixos', descricao: 'Esforço, Recompensa e Overcommitment.' },
  { id: 'OUTRA', nome: 'Outra metodologia', origem: 'Consultoria própria / customizada', fatores: 'variável', descricao: 'Será necessário mapear fatores manualmente para o COPSOQ-III.' },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXT = ['xlsx', 'xls', 'csv', 'pdf'] as const;
const ALLOWED_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv', 'application/csv', 'text/plain',
  'application/pdf',
]);

// Heurística: palavras-chave que indicam campos de matriz de risco psicossocial
const CAMPOS_DETECTAVEIS: Array<{ chave: string; padroes: RegExp; cor: string }> = [
  { chave: 'Fator/Dimensão', padroes: /\b(fator|dimens[ãa]o|categoria|tema|aspecto)\b/i, col: '', cor: 'bg-blue-100 text-blue-700 border-blue-300' } as any,
  { chave: 'Severidade', padroes: /\b(severidade|gravidade|impacto)\b/i, cor: 'bg-orange-100 text-orange-700 border-orange-300' } as any,
  { chave: 'Probabilidade', padroes: /\b(probabilidade|frequ[êe]ncia|chance|likelihood)\b/i, cor: 'bg-amber-100 text-amber-700 border-amber-300' } as any,
  { chave: 'Risco/Score', padroes: /\b(risco|score|pontua[çc][ãa]o|n[íi]vel|rating)\b/i, cor: 'bg-red-100 text-red-700 border-red-300' } as any,
  { chave: 'Unidade/Setor', padroes: /\b(unidade|setor|[áa]rea|departamento|gerencia|filial)\b/i, cor: 'bg-purple-100 text-purple-700 border-purple-300' } as any,
  { chave: 'Descrição', padroes: /\b(descri[çc][ãa]o|coment[áa]rio|observa[çc][ãa]o|detalhe)\b/i, cor: 'bg-slate-100 text-slate-700 border-slate-300' } as any,
  { chave: 'Plano/Ação', padroes: /\b(plano|a[çc][ãa]o|medida|controle|tratamento)\b/i, cor: 'bg-emerald-100 text-emerald-700 border-emerald-300' } as any,
];

type PreviewData =
  | { tipo: 'tabela'; sheets: string[]; sheetAtivo: string; headers: string[]; rows: string[][]; totalRows: number; totalCols: number; camposDetectados: Array<{ campo: string; coluna: string; cor: string }> }
  | { tipo: 'pdf'; tamanhoKb: number }
  | { tipo: 'erro'; mensagem: string };

const formSchema = z.object({
  metodologia: z.enum(['COPSOQ-III', 'HSE', 'JCQ', 'ERI', 'OUTRA']),
  metodologiaOutra: z.string().trim().max(120).optional(),
  consultoria: z.string().trim().max(120).optional(),
  dataDiagnostico: z.string().optional(),
  observacoes: z.string().trim().max(2000).optional(),
}).refine((v) => v.metodologia !== 'OUTRA' || !!v.metodologiaOutra?.trim(), {
  message: 'Informe o nome da metodologia personalizada.',
  path: ['metodologiaOutra'],
});

function validarArquivo(file: File): string | null {
  if (file.size === 0) return 'O arquivo está vazio.';
  if (file.size > MAX_FILE_SIZE) return `Arquivo excede o limite de 20 MB (atual: ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.includes(ext as typeof ALLOWED_EXT[number])) {
    return `Extensão ".${ext}" não suportada. Use: ${ALLOWED_EXT.join(', ')}.`;
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return `Tipo do arquivo (${file.type}) não corresponde aos formatos aceitos. Use Excel, CSV ou PDF.`;
  }
  return null;
}

function detectarCampos(headers: string[]): Array<{ campo: string; coluna: string; cor: string }> {
  const found: Array<{ campo: string; coluna: string; cor: string }> = [];
  const used = new Set<string>();
  for (const def of CAMPOS_DETECTAVEIS) {
    for (const h of headers) {
      if (!h) continue;
      if (def.padroes.test(h) && !used.has(def.chave)) {
        found.push({ campo: def.chave, coluna: h, cor: (def as any).cor });
        used.add(def.chave);
        break;
      }
    }
  }
  return found;
}

async function parsearArquivo(file: File): Promise<PreviewData> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') {
    return { tipo: 'pdf', tamanhoKb: Math.round(file.size / 1024) };
  }
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: false });
    const sheetAtivo = wb.SheetNames[0];
    if (!sheetAtivo) return { tipo: 'erro', mensagem: 'Não foi possível encontrar nenhuma planilha no arquivo.' };
    const sheet = wb.Sheets[sheetAtivo];
    const matriz = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, blankrows: false, defval: '' }) as any[][];
    if (!matriz.length) return { tipo: 'erro', mensagem: 'A planilha está vazia.' };
    const headers = (matriz[0] ?? []).map((c) => String(c ?? '').trim());
    if (headers.every(h => !h)) return { tipo: 'erro', mensagem: 'Não foi possível detectar cabeçalhos (primeira linha vazia).' };
    const dataRows = matriz.slice(1).map(r => r.map(c => String(c ?? '')));
    const preview = dataRows.slice(0, 8);
    return {
      tipo: 'tabela',
      sheets: wb.SheetNames,
      sheetAtivo,
      headers,
      rows: preview,
      totalRows: dataRows.length,
      totalCols: headers.length,
      camposDetectados: detectarCampos(headers),
    };
  } catch (e: any) {
    return { tipo: 'erro', mensagem: `Não foi possível ler o arquivo: ${e?.message ?? 'formato inválido ou corrompido'}.` };
  }
}

export function Nr1ImportarMatrizDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { activeCompanyId } = useCompanyContext();
  const [metodologia, setMetodologia] = useState<Metodologia>('COPSOQ-III');
  const [metodologiaOutra, setMetodologiaOutra] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [parsing, setParsing] = useState(false);
  const [consultoria, setConsultoria] = useState('');
  const [dataDiagnostico, setDataDiagnostico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setArquivo(null); setErroArquivo(null); setPreview(null);
    setConsultoria(''); setDataDiagnostico(''); setObservacoes('');
    setMetodologia('COPSOQ-III'); setMetodologiaOutra('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (f: File | null) => {
    setErroArquivo(null); setPreview(null);
    if (!f) { setArquivo(null); return; }
    const erro = validarArquivo(f);
    if (erro) {
      setArquivo(null); setErroArquivo(erro);
      toast.error('Arquivo inválido', { description: erro });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setArquivo(f);
    setParsing(true);
    const result = await parsearArquivo(f);
    setParsing(false);
    if (result.tipo === 'erro') {
      setErroArquivo(result.mensagem);
      toast.error('Não foi possível ler o arquivo', { description: result.mensagem });
      setArquivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setPreview(result);
    }
  };

  const handleSubmit = async () => {
    if (!activeCompanyId) { toast.error('Empresa não identificada. Recarregue a página.'); return; }
    if (!arquivo) { toast.error('Anexe a planilha/PDF da matriz de risco.'); return; }
    const parsed = formSchema.safeParse({ metodologia, metodologiaOutra, consultoria, dataDiagnostico, observacoes });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? 'Verifique os campos do formulário.'); return; }

    setSubmitting(true);
    try {
      const importacaoId = crypto.randomUUID();
      const ext = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const safeName = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
      const storagePath = `${activeCompanyId}/${importacaoId}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage.from('nr1-importacoes-matriz').upload(storagePath, arquivo, {
        contentType: arquivo.type || `application/octet-stream`,
        upsert: false,
      });
      if (upErr) throw upErr;

      const mapeamentoResultado = preview && preview.tipo === 'tabela' ? {
        sheets: preview.sheets,
        sheet_ativo: preview.sheetAtivo,
        headers: preview.headers,
        total_rows: preview.totalRows,
        total_cols: preview.totalCols,
        campos_detectados: preview.camposDetectados,
      } : null;

      const { error: insErr } = await supabase.from('nr1_importacoes_matriz').insert({
        id: importacaoId,
        company_id: activeCompanyId,
        metodologia,
        metodologia_outra: metodologia === 'OUTRA' ? metodologiaOutra.trim() : null,
        arquivo_path: storagePath,
        arquivo_nome: arquivo.name,
        arquivo_tamanho: arquivo.size,
        arquivo_mime: arquivo.type || `application/${ext}`,
        consultoria: consultoria.trim() || null,
        data_diagnostico: dataDiagnostico || null,
        observacoes: observacoes.trim() || null,
        status: 'pendente',
        mapeamento_resultado: mapeamentoResultado,
      });
      if (insErr) {
        await supabase.storage.from('nr1-importacoes-matriz').remove([storagePath]);
        throw insErr;
      }

      toast.success('Importação registrada', { description: 'Nossa equipe fará o mapeamento dos fatores em até 2 dias úteis.' });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      console.error('Erro ao importar matriz', e);
      const msg = e?.message?.includes('row-level security')
        ? 'Você não tem permissão para registrar importações nesta empresa.'
        : e?.message?.includes('Payload') ? 'Arquivo muito grande para envio.'
        : e?.message ?? 'Falha ao enviar a matriz. Tente novamente.';
      toast.error('Erro no envio', { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const meta = METODOLOGIAS.find(m => m.id === metodologia)!;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 nr1-text-primary" />
            Importar Matriz de Risco Externa
          </DialogTitle>
          <DialogDescription>
            Importe sua matriz de risco e a CompSmart converte para o padrão COPSOQ-III (13 fatores) para gerar PGR, planos de ação e relatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Alert className="border-[hsl(var(--nr1-primary)/0.3)] nr1-bg-soft">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Como funciona:</strong> escolha a metodologia, anexe o arquivo (Excel, CSV ou PDF). Faremos uma <strong>pré-leitura</strong> dos campos detectados e nossa equipe completa o <strong>de-para</strong> para o padrão COPSOQ-III/NR-1.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">1. Metodologia utilizada</Label>
            <RadioGroup value={metodologia} onValueChange={(v) => setMetodologia(v as Metodologia)} className="space-y-2">
              {METODOLOGIAS.map((m) => (
                <label key={m.id} htmlFor={`met-${m.id}`}
                  className={`flex items-start gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                    metodologia === m.id ? 'border-[hsl(var(--nr1-primary))] nr1-bg-soft' : 'border-border hover:border-muted-foreground/40'
                  }`}>
                  <RadioGroupItem value={m.id} id={`met-${m.id}`} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{m.nome}</span>
                      <Badge variant="outline" className="text-[10px]">{m.fatores}</Badge>
                      {m.id === 'COPSOQ-III' && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Padrão CompSmart
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.origem}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.descricao}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {metodologia === 'OUTRA' && (
            <div className="space-y-2">
              <Label htmlFor="met-outra" className="text-sm font-semibold">Nome da metodologia *</Label>
              <Input id="met-outra" value={metodologiaOutra} onChange={(e) => setMetodologiaOutra(e.target.value)} placeholder="Ex.: Metodologia própria XYZ" maxLength={120} />
            </div>
          )}

          {metodologia !== 'COPSOQ-III' && (
            <Alert className="border-amber-300 bg-amber-50">
              <ArrowRight className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Mapeamento automático:</strong> aplicaremos a tabela de de-para <strong>{meta.nome} ↔ COPSOQ-III</strong>. Fatores sem equivalente direto serão sinalizados para validação humana.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold">2. Arquivo da matriz de risco *</Label>
            <div className="flex items-center gap-2">
              <Input ref={fileInputRef} type="file"
                accept=".xlsx,.xls,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/pdf"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="cursor-pointer" disabled={submitting || parsing} />
              {arquivo && !parsing && (
                <Badge variant="outline" className="shrink-0 gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  {(arquivo.size / 1024).toFixed(0)} KB
                  <button type="button" onClick={() => handleFileChange(null)} className="ml-1 hover:text-destructive" aria-label="Remover">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
            {erroArquivo ? (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{erroArquivo}</AlertDescription>
              </Alert>
            ) : (
              <p className="text-[11px] text-muted-foreground">Formatos: Excel (.xlsx, .xls), CSV ou PDF — máx. 20 MB.</p>
            )}
          </div>

          {parsing && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando arquivo...
            </div>
          )}

          {preview && preview.tipo === 'pdf' && (
            <Alert className="border-blue-300 bg-blue-50">
              <FileText className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>PDF detectado ({preview.tamanhoKb} KB).</strong> A pré-visualização do conteúdo de PDFs é feita manualmente pela nossa equipe técnica. O arquivo será analisado e os fatores extraídos em até 2 dias úteis.
              </AlertDescription>
            </Alert>
          )}

          {preview && preview.tipo === 'tabela' && (
            <div className="space-y-3 rounded-lg border-2 border-[hsl(var(--nr1-primary)/0.3)] nr1-bg-soft/30 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 nr1-text-primary" />
                  <span className="font-semibold text-sm">Pré-visualização do arquivo</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <Badge variant="outline">{preview.totalRows} linhas</Badge>
                  <Badge variant="outline">{preview.totalCols} colunas</Badge>
                  {preview.sheets.length > 1 && (
                    <Badge variant="outline">{preview.sheets.length} abas (mostrando "{preview.sheetAtivo}")</Badge>
                  )}
                </div>
              </div>

              {preview.camposDetectados.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Campos detectados automaticamente:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.camposDetectados.map((c) => (
                      <Badge key={c.campo} className={`text-[10px] ${c.cor}`} variant="outline">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {c.campo}: <span className="font-normal ml-1 opacity-80">"{c.coluna}"</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert className="border-amber-300 bg-amber-50 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-[11px]">
                    Nenhum campo reconhecido automaticamente. Nossa equipe fará o mapeamento manual a partir dos cabeçalhos.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded border bg-background overflow-auto max-h-64">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-muted-foreground font-medium w-8">#</th>
                      {preview.headers.map((h, i) => (
                        <th key={i} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap border-l">
                          {h || <span className="text-muted-foreground italic">col {i + 1}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri} className="border-t hover:bg-muted/30">
                        <td className="px-2 py-1 text-muted-foreground">{ri + 1}</td>
                        {preview.headers.map((_, ci) => (
                          <td key={ci} className="px-2 py-1 border-l max-w-[200px] truncate" title={row[ci] ?? ''}>
                            {row[ci] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.totalRows > preview.rows.length && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Mostrando {preview.rows.length} de {preview.totalRows} linhas — o arquivo completo será processado no envio.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="consultoria" className="text-sm font-semibold">3. Consultoria responsável <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input id="consultoria" value={consultoria} onChange={(e) => setConsultoria(e.target.value)} placeholder="Ex.: XYZ SST" maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data" className="text-sm font-semibold">4. Data do diagnóstico</Label>
              <Input id="data" type="date" value={dataDiagnostico} onChange={(e) => setDataDiagnostico(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs" className="text-sm font-semibold">5. Observações <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Textarea id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} maxLength={2000} placeholder="Ex.: pesquisa aplicada nas unidades fabris; amostra de 320 colaboradores..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || parsing || !arquivo || !!erroArquivo} className="nr1-bg-primary">
            {submitting ? 'Enviando...' : preview ? 'Confirmar e enviar' : 'Enviar para mapeamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
