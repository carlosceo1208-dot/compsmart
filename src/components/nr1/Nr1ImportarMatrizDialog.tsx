import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload, FileSpreadsheet, ArrowRight, CheckCircle2, X, AlertCircle, FileText,
  Loader2, Eye, BookmarkPlus, Bookmark, Sparkles, FileType,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import {
  useNr1MapeamentoTemplates, useSalvarMapeamentoTemplate, marcarUsoTemplate,
  CAMPOS_DESTINO, type MetodologiaMatriz,
} from '@/hooks/useNr1MapeamentoTemplates';

type Metodologia = MetodologiaMatriz;

export interface MetodologiaItem {
  id: Metodologia;
  nome: string;
  origem: string;
  fatores: string;
  descricao: string;
}

export const METODOLOGIAS: MetodologiaItem[] = [
  { id: 'COPSOQ-III', nome: 'COPSOQ-III', origem: 'Dinamarca (padrão CompSmart)', fatores: '13 fatores', descricao: 'Copenhagen Psychosocial Questionnaire — referência ISO 45003 / NR-1.' },
  { id: 'HSE', nome: 'HSE Indicator Tool', origem: 'Reino Unido (Health & Safety Executive)', fatores: '7 dimensões', descricao: 'Demands, Control, Support, Relationships, Role, Change, Peer Support.' },
  { id: 'JCQ', nome: 'JCQ (Karasek)', origem: 'Modelo Demanda-Controle', fatores: '3 eixos', descricao: 'Demanda Psicológica, Controle/Latitude de Decisão, Suporte Social.' },
  { id: 'ERI', nome: 'ERI (Siegrist)', origem: 'Desequilíbrio Esforço-Recompensa', fatores: '3 eixos', descricao: 'Esforço, Recompensa e Overcommitment.' },
  { id: 'OUTRA', nome: 'Outra metodologia', origem: 'Consultoria própria / customizada', fatores: 'variável', descricao: 'Será necessário mapear fatores manualmente para o COPSOQ-III ("Depende de análise de viabilidade").' },
];

export interface MetodologiaCardProps {
  m: MetodologiaItem;
  isSelected: boolean;
  onSelect: () => void;
}

export function MetodologiaCard({ m, isSelected, onSelect }: MetodologiaCardProps) {
  return (
    <label
      htmlFor={`met-${m.id}`}
      className={`flex items-start gap-2 rounded-lg border-2 p-2.5 cursor-pointer transition-colors ${
        isSelected ? 'border-[hsl(var(--nr1-primary))] nr1-bg-soft' : 'border-border hover:border-muted-foreground/40'
      }`}
    >
      <RadioGroupItem value={m.id} id={`met-${m.id}`} className="mt-1" onClick={onSelect} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-xs">{m.nome}</span>
          <Badge variant="outline" className="text-[9px] py-0">{m.fatores}</Badge>
          {m.id === 'COPSOQ-III' && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[9px] py-0">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Padrão
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
          {m.descricao?.trim() || 'Descrição indisponível. Entre em contato com o suporte para mais informações.'}
        </p>
      </div>
    </label>
  );
}

type Modo = 'arquivo' | 'texto';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TEXT_LENGTH = 200_000;
const ALLOWED_EXT = ['xlsx', 'xls', 'csv', 'pdf'] as const;
const ALLOWED_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv', 'application/csv', 'text/plain',
  'application/pdf',
]);

// Heurística para sugerir destino COPSOQ a partir do nome da coluna
const SUGESTOES: Array<{ alvo: string; padroes: RegExp }> = [
  { alvo: 'severidade', padroes: /\b(severidade|gravidade|impacto)\b/i },
  { alvo: 'probabilidade', padroes: /\b(probabilidade|frequ[êe]ncia|chance|likelihood)\b/i },
  { alvo: 'score_risco', padroes: /\b(risco|score|pontua[çc][ãa]o|n[íi]vel|rating|grau)\b/i },
  { alvo: 'fator_nome', padroes: /\b(fator|perigo|risco psicossocial|hazard)\b/i },
  { alvo: 'unidade_setor', padroes: /\b(unidade|setor|[áa]rea|departamento|gerencia|filial|local)\b/i },
  { alvo: 'cargo_funcao', padroes: /\b(cargo|fun[çc][ãa]o|posi[çc][ãa]o|role)\b/i },
  { alvo: 'descricao', padroes: /\b(descri[çc][ãa]o|coment[áa]rio|observa[çc][ãa]o|detalhe)\b/i },
  { alvo: 'plano_acao', padroes: /\b(plano|a[çc][ãa]o|medida|controle|tratamento)\b/i },
  { alvo: 'prazo', padroes: /\b(prazo|data|deadline|previs[ãa]o)\b/i },
  { alvo: 'responsavel', padroes: /\b(respons[áa]vel|owner|gestor)\b/i },
  { alvo: 'dim_demandas_trabalho', padroes: /\b(demand[ao]s?( de)? trabalho|carga|ritmo|exig[êe]ncia)\b/i },
  { alvo: 'dim_organizacao_conteudo', padroes: /\b(organiza[çc][ãa]o|conte[úu]do|autonomia|sentido)\b/i },
  { alvo: 'dim_relacoes_lideranca', padroes: /\b(lideran[çc]a|chefia|rela[çc][õo]es|conflito|ass[ée]dio)\b/i },
  { alvo: 'dim_interface_trabalho_individuo', padroes: /\b(interface|vida pessoal|fam[íi]lia|work[- ]?life)\b/i },
  { alvo: 'dim_valores_trabalho', padroes: /\b(valores|justi[çc]a|confian[çc]a|reconhecimento)\b/i },
  { alvo: 'dim_saude_bem_estar', padroes: /\b(sa[úu]de|bem[- ]estar|estresse|burnout|sintoma)\b/i },
];

function sugerirAlvo(header: string): string {
  for (const s of SUGESTOES) if (s.padroes.test(header)) return s.alvo;
  return 'ignorar';
}

import {
  parsearTextoMatriz, montarMetaDeMatriz, detectarDelimitador as detectarDelim,
  type ColunaMeta, type DelimiterDetection, tipoLabel, tipoCor,
} from '@/lib/nr1MatrizParser';

type PreviewData =
  | {
      tipo: 'tabela'; origem: 'arquivo' | 'texto';
      sheets?: string[]; sheetAtivo?: string;
      headers: string[]; rows: string[][];
      totalRows: number; totalCols: number;
      delimitador?: DelimiterDetection;
      colunas: ColunaMeta[];
      warnings: string[];
    }
  | { tipo: 'texto_livre'; linhas: string[]; totalLinhas: number; totalCaracteres: number; razao: string }
  | { tipo: 'pdf'; tamanhoKb: number }
  | { tipo: 'erro'; mensagem: string };

const formSchema = z.object({
  metodologia: z.enum(['COPSOQ-III', 'HSE', 'JCQ', 'ERI', 'OUTRA']),
  metodologiaOutra: z.string().trim().max(120).optional(),
  consultoria: z.string().trim().max(120).optional(),
  dataDiagnostico: z.string().optional(),
  observacoes: z.string().trim().max(2000).optional(),
}).refine((v) => v.metodologia !== 'OUTRA' || !!v.metodologiaOutra?.trim(), {
  message: 'Informe o nome da metodologia personalizada.', path: ['metodologiaOutra'],
});

function validarArquivo(file: File): string | null {
  if (file.size === 0) return 'O arquivo está vazio.';
  if (file.size > MAX_FILE_SIZE) return `Arquivo excede 20 MB (atual: ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.includes(ext as typeof ALLOWED_EXT[number])) return `Extensão ".${ext}" não suportada. Use: ${ALLOWED_EXT.join(', ')}.`;
  if (file.type && !ALLOWED_MIME.has(file.type)) return `Tipo (${file.type}) não corresponde a Excel, CSV ou PDF.`;
  return null;
}

async function parsearArquivo(file: File): Promise<PreviewData> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return { tipo: 'pdf', tamanhoKb: Math.round(file.size / 1024) };
  try {
    const buf = await file.arrayBuffer();
    // CSV: tenta detectar delimitador pelo conteúdo bruto antes de delegar ao XLSX
    if (ext === 'csv') {
      const txt = new TextDecoder('utf-8').decode(buf);
      const linhas = txt.split(/\r?\n/).filter(l => l.trim().length > 0);
      const delim = detectarDelim(linhas);
      // Reescreve para tabs para o XLSX (tratamento uniforme)
      const wb = XLSX.read(buf, { type: 'array', cellDates: false, FS: delim.raw || ',' });
      const sa = wb.SheetNames[0];
      const sheet = wb.Sheets[sa];
      const matriz = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, blankrows: false, defval: '' }) as any[][];
      if (!matriz.length) return { tipo: 'erro', mensagem: 'O CSV está vazio.' };
      const headers = (matriz[0] ?? []).map((c) => String(c ?? '').trim());
      if (headers.every(h => !h)) return { tipo: 'erro', mensagem: 'Cabeçalhos não detectados na primeira linha do CSV.' };
      const dataRows = matriz.slice(1).map(r => r.map(c => String(c ?? '')));
      const meta = montarMetaDeMatriz(headers, dataRows);
      return {
        tipo: 'tabela', origem: 'arquivo',
        sheets: wb.SheetNames, sheetAtivo: sa,
        headers, rows: dataRows.slice(0, 10),
        totalRows: dataRows.length, totalCols: headers.length,
        delimitador: delim, colunas: meta.colunas, warnings: meta.warnings,
      };
    }

    const wb = XLSX.read(buf, { type: 'array', cellDates: false });
    const sheetAtivo = wb.SheetNames[0];
    if (!sheetAtivo) return { tipo: 'erro', mensagem: 'Nenhuma planilha encontrada no arquivo.' };
    const sheet = wb.Sheets[sheetAtivo];
    const matriz = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, blankrows: false, defval: '' }) as any[][];
    if (!matriz.length) return { tipo: 'erro', mensagem: 'A planilha está vazia.' };
    const headers = (matriz[0] ?? []).map((c) => String(c ?? '').trim());
    if (headers.every(h => !h)) return { tipo: 'erro', mensagem: 'Cabeçalhos não detectados na primeira linha.' };
    const dataRows = matriz.slice(1).map(r => r.map(c => String(c ?? '')));
    const meta = montarMetaDeMatriz(headers, dataRows);
    return {
      tipo: 'tabela', origem: 'arquivo',
      sheets: wb.SheetNames, sheetAtivo,
      headers, rows: dataRows.slice(0, 10),
      totalRows: dataRows.length, totalCols: headers.length,
      colunas: meta.colunas, warnings: meta.warnings,
    };
  } catch (e: any) {
    return { tipo: 'erro', mensagem: `Não foi possível ler o arquivo: ${e?.message ?? 'formato inválido'}.` };
  }
}

function parsearTexto(texto: string): PreviewData {
  if (texto.length > MAX_TEXT_LENGTH) return { tipo: 'erro', mensagem: `Texto excede ${MAX_TEXT_LENGTH.toLocaleString('pt-BR')} caracteres.` };
  const r = parsearTextoMatriz(texto);
  if (r.ok === false) {
    if (r.razao === 'vazio') return { tipo: 'erro', mensagem: r.mensagem };
    const ls = r.linhas ?? [];
    return {
      tipo: 'texto_livre',
      linhas: ls.slice(0, 15),
      totalLinhas: ls.length,
      totalCaracteres: texto.length,
      razao: r.mensagem,
    };
  }
  return {
    tipo: 'tabela', origem: 'texto',
    headers: r.data.headers, rows: r.data.rows.slice(0, 10),
    totalRows: r.data.totalRows, totalCols: r.data.totalCols,
    delimitador: r.data.delimitador,
    colunas: r.data.colunas,
    warnings: r.data.warnings,
  };
}

export function Nr1ImportarMatrizDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { activeCompanyId } = useCompanyContext();
  const [modo, setModo] = useState<Modo>('arquivo');
  const [metodologia, setMetodologia] = useState<Metodologia>('COPSOQ-III');
  const [metodologiaOutra, setMetodologiaOutra] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [textoLivre, setTextoLivre] = useState('');
  const [erroEntrada, setErroEntrada] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [parsing, setParsing] = useState(false);
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({});
  const [templateAplicadoId, setTemplateAplicadoId] = useState<string | null>(null);
  const [salvarComoTemplate, setSalvarComoTemplate] = useState(false);
  const [nomeTemplate, setNomeTemplate] = useState('');
  const [marcarPadrao, setMarcarPadrao] = useState(false);
  const [consultoria, setConsultoria] = useState('');
  const [dataDiagnostico, setDataDiagnostico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates } = useNr1MapeamentoTemplates(metodologia);
  const salvarTemplate = useSalvarMapeamentoTemplate();

  const reset = () => {
    setModo('arquivo'); setArquivo(null); setTextoLivre(''); setErroEntrada(null); setPreview(null);
    setMapeamento({}); setTemplateAplicadoId(null);
    setSalvarComoTemplate(false); setNomeTemplate(''); setMarcarPadrao(false);
    setConsultoria(''); setDataDiagnostico(''); setObservacoes('');
    setMetodologia('COPSOQ-III'); setMetodologiaOutra('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Preview com cabeçalhos? Inicializa mapeamento com sugestões + template default
  useEffect(() => {
    if (!preview || preview.tipo !== 'tabela') return;
    const tplDefault = templates?.find(t => t.is_default);
    const novoMap: Record<string, string> = {};
    for (const h of preview.headers) {
      if (tplDefault?.mapeamento?.[h]) novoMap[h] = tplDefault.mapeamento[h];
      else novoMap[h] = sugerirAlvo(h);
    }
    setMapeamento(novoMap);
    setTemplateAplicadoId(tplDefault?.id ?? null);
    if (tplDefault) toast.info(`Template padrão "${tplDefault.nome}" aplicado automaticamente.`);
  }, [preview, templates]);

  const aplicarTemplate = (templateId: string) => {
    if (templateId === '__none') { setTemplateAplicadoId(null); return; }
    const tpl = templates?.find(t => t.id === templateId);
    if (!tpl || !preview || preview.tipo !== 'tabela') return;
    const novoMap: Record<string, string> = {};
    for (const h of preview.headers) novoMap[h] = tpl.mapeamento[h] ?? sugerirAlvo(h);
    setMapeamento(novoMap);
    setTemplateAplicadoId(tpl.id);
    toast.success(`Template "${tpl.nome}" aplicado.`);
  };

  const handleFileChange = async (f: File | null) => {
    setErroEntrada(null); setPreview(null); setMapeamento({}); setTemplateAplicadoId(null);
    if (!f) { setArquivo(null); return; }
    const erro = validarArquivo(f);
    if (erro) {
      setArquivo(null); setErroEntrada(erro);
      toast.error('Arquivo inválido', { description: erro });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setArquivo(f);
    setParsing(true);
    const r = await parsearArquivo(f);
    setParsing(false);
    if (r.tipo === 'erro') {
      setErroEntrada(r.mensagem); toast.error('Não foi possível ler o arquivo', { description: r.mensagem });
      setArquivo(null); if (fileInputRef.current) fileInputRef.current.value = '';
    } else { setPreview(r); }
  };

  const analisarTexto = () => {
    setErroEntrada(null); setPreview(null); setMapeamento({}); setTemplateAplicadoId(null);
    const r = parsearTexto(textoLivre);
    if (r.tipo === 'erro') { setErroEntrada(r.mensagem); toast.error(r.mensagem); return; }
    setPreview(r);
    if (r.tipo === 'texto_livre') {
      toast.info('Texto não-estruturado detectado', {
        description: 'Não foi possível identificar colunas. Nossa equipe fará a estruturação manualmente.',
      });
    }
  };

  const headers = preview && preview.tipo === 'tabela' ? preview.headers : [];
  const mapeamentosUsados = useMemo(() => {
    const set = new Set<string>();
    Object.values(mapeamento).forEach(v => { if (v !== 'ignorar') set.add(v); });
    return set;
  }, [mapeamento]);

  const handleSubmit = async () => {
    if (!activeCompanyId) { toast.error('Empresa não identificada.'); return; }
    const parsed = formSchema.safeParse({ metodologia, metodologiaOutra, consultoria, dataDiagnostico, observacoes });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? 'Verifique os campos.'); return; }

    if (modo === 'arquivo' && !arquivo) { toast.error('Anexe a planilha/PDF da matriz.'); return; }
    if (modo === 'texto' && !textoLivre.trim()) { toast.error('Cole o conteúdo da matriz.'); return; }
    if (modo === 'texto' && !preview) { toast.error('Clique em "Analisar texto" antes de enviar.'); return; }

    if (salvarComoTemplate && !nomeTemplate.trim()) {
      toast.error('Informe um nome para o template.'); return;
    }

    setSubmitting(true);
    try {
      let storagePath: string | null = null;
      const importacaoId = crypto.randomUUID();

      if (modo === 'arquivo' && arquivo) {
        const safeName = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
        storagePath = `${activeCompanyId}/${importacaoId}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from('nr1-importacoes-matriz')
          .upload(storagePath, arquivo, { contentType: arquivo.type || 'application/octet-stream', upsert: false });
        if (upErr) throw upErr;
      }

      // Salvar template (antes do insert para obter id)
      let templateIdFinal = templateAplicadoId;
      if (salvarComoTemplate && preview?.tipo === 'tabela') {
        const tpl = await salvarTemplate.mutateAsync({
          metodologia,
          nome: nomeTemplate.trim(),
          descricao: `Criado a partir da importação de ${arquivo?.name ?? 'texto livre'}`,
          mapeamento,
          is_default: marcarPadrao,
        });
        templateIdFinal = (tpl as any)?.id ?? templateIdFinal;
      }

      const mapeamentoResultado = preview && preview.tipo === 'tabela' ? {
        origem: preview.origem,
        sheets: preview.sheets,
        sheet_ativo: preview.sheetAtivo,
        delimitador: preview.delimitador,
        headers: preview.headers,
        total_rows: preview.totalRows,
        total_cols: preview.totalCols,
      } : preview && preview.tipo === 'texto_livre' ? {
        origem: 'texto_livre',
        total_linhas: preview.totalLinhas,
        total_caracteres: preview.totalCaracteres,
        estruturado: false,
      } : null;

      const insertPayload: any = {
        id: importacaoId,
        company_id: activeCompanyId,
        modo,
        metodologia,
        metodologia_outra: metodologia === 'OUTRA' ? metodologiaOutra.trim() : null,
        consultoria: consultoria.trim() || null,
        data_diagnostico: dataDiagnostico || null,
        observacoes: observacoes.trim() || null,
        status: 'pendente',
        mapeamento_resultado: mapeamentoResultado,
        mapeamento_aplicado: preview?.tipo === 'tabela' ? mapeamento : null,
        template_id: templateIdFinal,
      };

      if (modo === 'arquivo' && arquivo && storagePath) {
        const ext = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin';
        Object.assign(insertPayload, {
          arquivo_path: storagePath,
          arquivo_nome: arquivo.name,
          arquivo_tamanho: arquivo.size,
          arquivo_mime: arquivo.type || `application/${ext}`,
        });
      } else if (modo === 'texto') {
        insertPayload.texto_livre = textoLivre.trim();
      }

      const { error: insErr } = await supabase.from('nr1_importacoes_matriz').insert(insertPayload);
      if (insErr) {
        if (storagePath) await supabase.storage.from('nr1-importacoes-matriz').remove([storagePath]);
        throw insErr;
      }

      if (templateIdFinal) {
        marcarUsoTemplate(templateIdFinal).catch(() => {});
      }

      toast.success('Importação registrada', { description: 'Equipe fará o mapeamento em até 2 dias úteis.' });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      console.error('Erro ao importar matriz', e);
      const msg = e?.message?.includes('row-level security') ? 'Sem permissão para registrar nesta empresa.'
        : e?.message?.includes('Payload') ? 'Conteúdo muito grande para envio.'
        : e?.message ?? 'Falha no envio. Tente novamente.';
      toast.error('Erro no envio', { description: msg });
    } finally { setSubmitting(false); }
  };

  const meta = METODOLOGIAS.find(m => m.id === metodologia)!;
  const podeEnviar = !submitting && !parsing && !erroEntrada && (
    (modo === 'arquivo' && !!arquivo) || (modo === 'texto' && !!textoLivre.trim())
  );

  // Agrupa campos de destino para o Select
  const camposPorGrupo = useMemo(() => {
    const grupos: Record<string, typeof CAMPOS_DESTINO> = {};
    for (const c of CAMPOS_DESTINO) (grupos[c.grupo] ??= []).push(c);
    return grupos;
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 nr1-text-primary" />
            Importar Matriz de Risco Externa
          </DialogTitle>
          <DialogDescription>
            Importe sua matriz de risco (arquivo ou texto livre). Mapeie as colunas para o padrão COPSOQ-III e salve o de-para como <strong>template reutilizável</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* 1. Metodologia */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">1. Metodologia utilizada</Label>
            <RadioGroup value={metodologia} onValueChange={(v) => { setMetodologia(v as Metodologia); setMapeamento({}); setTemplateAplicadoId(null); }} className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {METODOLOGIAS.map((m) => (
                <label key={m.id} htmlFor={`met-${m.id}`}
                  className={`flex items-start gap-2 rounded-lg border-2 p-2.5 cursor-pointer transition-colors ${
                    metodologia === m.id ? 'border-[hsl(var(--nr1-primary))] nr1-bg-soft' : 'border-border hover:border-muted-foreground/40'
                  }`}>
                  <RadioGroupItem value={m.id} id={`met-${m.id}`} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs">{m.nome}</span>
                      <Badge variant="outline" className="text-[9px] py-0">{m.fatores}</Badge>
                      {m.id === 'COPSOQ-III' && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[9px] py-0"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Padrão</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{m.descricao}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
            {metodologia === 'OUTRA' && (
              <Input value={metodologiaOutra} onChange={(e) => setMetodologiaOutra(e.target.value)} placeholder="Nome da metodologia personalizada *" maxLength={120} className="mt-2" />
            )}
          </div>

          {/* Template existente */}
          {templates && templates.length > 0 && (
            <Alert className="border-emerald-300 bg-emerald-50/50">
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="text-xs flex items-center justify-between gap-3 flex-wrap">
                <span><strong>{templates.length}</strong> template(s) de mapeamento disponíveis para <strong>{meta.nome}</strong>.</span>
                <Select value={templateAplicadoId ?? '__none'} onValueChange={aplicarTemplate} disabled={!preview || preview.tipo !== 'tabela'}>
                  <SelectTrigger className="h-7 text-xs w-56"><SelectValue placeholder="Aplicar template..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Não aplicar —</SelectItem>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.is_default && '⭐ '}{t.nome} <span className="text-muted-foreground ml-1">({t.uso_count}x)</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AlertDescription>
            </Alert>
          )}

          {/* 2. Modo de entrada */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">2. Como deseja importar?</Label>
            <Tabs value={modo} onValueChange={(v) => { setModo(v as Modo); setPreview(null); setErroEntrada(null); setMapeamento({}); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="arquivo" className="gap-2"><FileSpreadsheet className="h-3.5 w-3.5" />Arquivo (Excel/CSV/PDF)</TabsTrigger>
                <TabsTrigger value="texto" className="gap-2"><FileType className="h-3.5 w-3.5" />Texto livre</TabsTrigger>
              </TabsList>

              <TabsContent value="arquivo" className="space-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <Input ref={fileInputRef} type="file"
                    accept=".xlsx,.xls,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/pdf"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    className="cursor-pointer" disabled={submitting || parsing} />
                  {arquivo && !parsing && (
                    <Badge variant="outline" className="shrink-0 gap-1">
                      <FileSpreadsheet className="h-3 w-3" />{(arquivo.size / 1024).toFixed(0)} KB
                      <button type="button" onClick={() => handleFileChange(null)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">Excel (.xlsx, .xls), CSV ou PDF — máx. 20 MB.</p>
              </TabsContent>

              <TabsContent value="texto" className="space-y-2 mt-3">
                <Textarea value={textoLivre} onChange={(e) => setTextoLivre(e.target.value)}
                  placeholder={`Cole aqui o conteúdo da matriz. Aceita:\n• Tabela copiada de Word/Excel/PDF (com tabs, vírgulas, ponto-e-vírgula ou pipes)\n• Texto corrido de relatório de consultoria\n\nExemplo:\nFator\tSeveridade\tProbabilidade\tÁrea\nCarga de trabalho\tAlta\tFrequente\tProdução`}
                  rows={8} maxLength={MAX_TEXT_LENGTH} className="font-mono text-xs" />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">{textoLivre.length.toLocaleString('pt-BR')} / {MAX_TEXT_LENGTH.toLocaleString('pt-BR')} caracteres</p>
                  <Button size="sm" variant="outline" onClick={analisarTexto} disabled={!textoLivre.trim() || submitting}>
                    <Eye className="h-3.5 w-3.5 mr-1" />Analisar texto
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {erroEntrada && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{erroEntrada}</AlertDescription>
              </Alert>
            )}
          </div>

          {parsing && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando...
            </div>
          )}

          {/* Preview PDF */}
          {preview?.tipo === 'pdf' && (
            <Alert className="border-blue-300 bg-blue-50">
              <FileText className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>PDF ({preview.tamanhoKb} KB).</strong> A extração do conteúdo de PDFs é feita manualmente pela equipe técnica. Caso prefira agilizar, copie o conteúdo do PDF e use a aba <strong>"Texto livre"</strong>.
              </AlertDescription>
            </Alert>
          )}

          {/* Preview texto livre não-estruturado */}
          {preview?.tipo === 'texto_livre' && (
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50/40 p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <FileType className="h-4 w-4 text-amber-700" />
                <span className="font-semibold text-sm">Texto não-estruturado detectado</span>
                <Badge variant="outline" className="text-[10px]">{preview.totalLinhas} linhas</Badge>
                <Badge variant="outline" className="text-[10px]">{preview.totalCaracteres.toLocaleString('pt-BR')} car.</Badge>
              </div>
              <p className="text-[11px] text-amber-800">{preview.razao}</p>
              <p className="text-[11px] text-muted-foreground">
                O conteúdo será analisado pela equipe técnica (NLP + revisão humana) para extração de fatores, severidade e probabilidade. Para acelerar, tente colar o conteúdo em formato de <strong>tabela</strong> (com TAB, vírgula, ponto-e-vírgula, pipe ou markdown).
              </p>
              <div className="rounded border bg-background p-2 max-h-40 overflow-auto">
                {preview.linhas.map((l, i) => (
                  <div key={i} className="text-[11px] font-mono py-0.5 border-b last:border-b-0 truncate">{l}</div>
                ))}
              </div>
            </div>
          )}

          {/* Preview tabela + mapeamento */}
          {preview?.tipo === 'tabela' && (
            <div className="space-y-3 rounded-lg border-2 border-[hsl(var(--nr1-primary)/0.3)] nr1-bg-soft/30 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 nr1-text-primary" />
                  <span className="font-semibold text-sm">Pré-visualização e mapeamento</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <Badge variant="outline">{preview.totalRows} linhas</Badge>
                  <Badge variant="outline">{preview.totalCols} colunas</Badge>
                  {preview.delimitador && (
                    <Badge variant="outline" title={preview.delimitador.rationale}>
                      delim: {preview.delimitador.char} · {(preview.delimitador.confidence * 100).toFixed(0)}%
                    </Badge>
                  )}
                  {preview.sheets && preview.sheets.length > 1 && <Badge variant="outline">{preview.sheets.length} abas</Badge>}
                </div>
              </div>

              {/* Warnings de parsing */}
              {preview.warnings.length > 0 && (
                <Alert className="border-amber-300 bg-amber-50 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-[11px]">
                    <ul className="list-disc list-inside space-y-0.5">
                      {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Aplicar template (botões rápidos) */}
              {templates && templates.length > 0 && (
                <div className="rounded border border-dashed bg-background/60 p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 nr1-text-primary" />
                    <span className="text-[11px] font-semibold">Aplicar template de mapeamento:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {templates.map(t => {
                      const ativo = templateAplicadoId === t.id;
                      return (
                        <Button
                          key={t.id}
                          size="sm"
                          variant={ativo ? 'default' : 'outline'}
                          className={`h-7 text-[11px] gap-1 ${ativo ? 'nr1-bg-primary' : ''}`}
                          onClick={() => aplicarTemplate(t.id)}
                        >
                          {t.is_default && <span title="Padrão">⭐</span>}
                          {ativo && <CheckCircle2 className="h-3 w-3" />}
                          {t.nome}
                          <span className="opacity-60">({t.uso_count}x)</span>
                        </Button>
                      );
                    })}
                    {templateAplicadoId && (
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => aplicarTemplate('__none')}>
                        <X className="h-3 w-3 mr-1" />Limpar
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Mapeamento por coluna */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">De-para para COPSOQ-III</p>
                <div className="rounded border bg-background overflow-auto max-h-80">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-muted/80">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-semibold">Coluna detectada</th>
                        <th className="px-2 py-1.5 text-left font-semibold w-16">Tipo</th>
                        <th className="px-2 py-1.5 text-left font-semibold w-16">Vazios</th>
                        <th className="px-2 py-1.5 text-left font-semibold w-6"></th>
                        <th className="px-2 py-1.5 text-left font-semibold">Campo CompSmart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headers.map((h, i) => {
                        const alvo = mapeamento[h] ?? 'ignorar';
                        const isUsedTwice = alvo !== 'ignorar' && Object.entries(mapeamento).filter(([k, v]) => k !== h && v === alvo).length > 0;
                        const col = preview.colunas[i];
                        return (
                          <tr key={i} className="border-t hover:bg-muted/30 align-top">
                            <td className="px-2 py-1.5">
                              <div className="font-medium truncate max-w-[260px]" title={h}>
                                {h || <span className="italic text-muted-foreground">col {i + 1}</span>}
                              </div>
                              {col?.exemplos.length > 0 && (
                                <div className="text-[10px] text-muted-foreground truncate max-w-[260px]" title={col.exemplos.join(' | ')}>
                                  ex: {col.exemplos.slice(0, 2).join(' • ')}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-1.5">
                              {col && (
                                <Badge variant="outline" className={`text-[9px] py-0 ${tipoCor(col.tipo)}`}>{tipoLabel(col.tipo)}</Badge>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-[10px] text-muted-foreground">
                              {col ? `${col.vazios}/${preview.totalRows}` : '—'}
                            </td>
                            <td className="px-2 py-1.5 text-muted-foreground"><ArrowRight className="h-3 w-3" /></td>
                            <td className="px-2 py-1">
                              <Select value={alvo} onValueChange={(v) => setMapeamento(m => ({ ...m, [h]: v }))}>
                                <SelectTrigger className={`h-7 text-[11px] ${isUsedTwice ? 'border-amber-400' : ''}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(camposPorGrupo).map(([grupo, items]) => (
                                    <SelectGroup key={grupo}>
                                      <SelectLabel className="text-[10px]">{grupo}</SelectLabel>
                                      {items.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}
                                    </SelectGroup>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {Array.from(mapeamentosUsados).length === 0 && (
                  <p className="text-[10px] text-amber-700">⚠ Nenhum campo mapeado ainda — todos serão ignorados.</p>
                )}
              </div>


              {/* Amostra de dados */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">Ver amostra dos dados ({Math.min(8, preview.rows.length)} primeiras linhas)</summary>
                <div className="mt-2 rounded border bg-background overflow-auto max-h-48">
                  <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-muted/80">
                      <tr><th className="px-2 py-1 text-left w-6">#</th>{headers.map((h, i) => <th key={i} className="px-2 py-1 text-left border-l whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, ri) => (
                        <tr key={ri} className="border-t">
                          <td className="px-2 py-0.5 text-muted-foreground">{ri + 1}</td>
                          {headers.map((_, ci) => <td key={ci} className="px-2 py-0.5 border-l max-w-[180px] truncate" title={row[ci]}>{row[ci]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              {/* Salvar como template */}
              <div className="rounded border border-dashed p-3 space-y-2 bg-background/60">
                <div className="flex items-center gap-2">
                  <Checkbox id="save-tpl" checked={salvarComoTemplate} onCheckedChange={(v) => setSalvarComoTemplate(!!v)} />
                  <Label htmlFor="save-tpl" className="text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    Salvar este de-para como template para futuras importações de <span className="nr1-text-primary">{meta.nome}</span>
                  </Label>
                </div>
                {salvarComoTemplate && (
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end pl-6">
                    <div>
                      <Label htmlFor="tpl-nome" className="text-[11px]">Nome do template *</Label>
                      <Input id="tpl-nome" value={nomeTemplate} onChange={(e) => setNomeTemplate(e.target.value)} placeholder={`Ex.: Padrão ${meta.nome} 2026`} maxLength={80} className="h-8 text-xs" />
                    </div>
                    <label className="flex items-center gap-2 text-[11px] cursor-pointer pb-1.5">
                      <Checkbox checked={marcarPadrao} onCheckedChange={(v) => setMarcarPadrao(!!v)} />
                      <Bookmark className="h-3 w-3" /> Marcar como padrão da metodologia
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Metadados */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="consultoria" className="text-sm font-semibold">3. Consultoria <span className="text-muted-foreground font-normal text-[11px]">(opcional)</span></Label>
              <Input id="consultoria" value={consultoria} onChange={(e) => setConsultoria(e.target.value)} placeholder="Ex.: XYZ SST" maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="data" className="text-sm font-semibold">4. Data do diagnóstico</Label>
              <Input id="data" type="date" value={dataDiagnostico} onChange={(e) => setDataDiagnostico(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="obs" className="text-sm font-semibold">5. Observações <span className="text-muted-foreground font-normal text-[11px]">(opcional)</span></Label>
            <Textarea id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} maxLength={2000} placeholder="Ex.: amostra de 320 colaboradores em 3 unidades fabris..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!podeEnviar} className="nr1-bg-primary">
            {submitting ? 'Enviando...' : preview?.tipo === 'tabela' ? 'Confirmar mapeamento e enviar' : 'Enviar para análise'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
