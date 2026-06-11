import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Info, ArrowRight, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { z } from 'zod';

type Metodologia = 'COPSOQ-III' | 'HSE' | 'JCQ' | 'ERI' | 'OUTRA';

const METODOLOGIAS: Array<{ id: Metodologia; nome: string; origem: string; fatores: string; descricao: string }> = [
  { id: 'COPSOQ-III', nome: 'COPSOQ-III', origem: 'Dinamarca (padrão CompSmart)', fatores: '13 fatores', descricao: 'Copenhagen Psychosocial Questionnaire — referência ISO 45003 / NR-1.' },
  { id: 'HSE', nome: 'HSE Indicator Tool', origem: 'Reino Unido (Health & Safety Executive)', fatores: '7 dimensões', descricao: 'Demands, Control, Support, Relationships, Role, Change, Peer Support.' },
  { id: 'JCQ', nome: 'JCQ (Karasek)', origem: 'Modelo Demanda-Controle', fatores: '3 eixos', descricao: 'Demanda Psicológica, Controle/Latitude de Decisão, Suporte Social.' },
  { id: 'ERI', nome: 'ERI (Siegrist)', origem: 'Desequilíbrio Esforço-Recompensa', fatores: '3 eixos', descricao: 'Esforço, Recompensa e Overcommitment.' },
  { id: 'OUTRA', nome: 'Outra metodologia', origem: 'Consultoria própria / customizada', fatores: 'variável', descricao: 'Será necessário mapear fatores manualmente para o COPSOQ-III.' },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_EXT = ['xlsx', 'xls', 'csv', 'pdf'] as const;
const ALLOWED_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
  'application/csv',
  'text/plain', // alguns CSVs
  'application/pdf',
]);

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
    // alguns navegadores devolvem mime vazio — confiamos na extensão nesse caso
    return `Tipo do arquivo (${file.type}) não corresponde aos formatos aceitos. Use Excel, CSV ou PDF.`;
  }
  return null;
}

export function Nr1ImportarMatrizDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { activeCompanyId } = useCompanyContext();
  const [metodologia, setMetodologia] = useState<Metodologia>('COPSOQ-III');
  const [metodologiaOutra, setMetodologiaOutra] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [consultoria, setConsultoria] = useState('');
  const [dataDiagnostico, setDataDiagnostico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setArquivo(null);
    setErroArquivo(null);
    setConsultoria('');
    setDataDiagnostico('');
    setObservacoes('');
    setMetodologia('COPSOQ-III');
    setMetodologiaOutra('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (f: File | null) => {
    setErroArquivo(null);
    if (!f) { setArquivo(null); return; }
    const erro = validarArquivo(f);
    if (erro) {
      setArquivo(null);
      setErroArquivo(erro);
      toast.error('Arquivo inválido', { description: erro });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setArquivo(f);
  };

  const handleSubmit = async () => {
    if (!activeCompanyId) {
      toast.error('Empresa não identificada. Recarregue a página.');
      return;
    }
    if (!arquivo) {
      toast.error('Anexe a planilha/PDF da matriz de risco.');
      return;
    }

    const parsed = formSchema.safeParse({ metodologia, metodologiaOutra, consultoria, dataDiagnostico, observacoes });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Verifique os campos do formulário.');
      return;
    }

    setSubmitting(true);
    try {
      const importacaoId = crypto.randomUUID();
      const ext = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const safeName = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
      const storagePath = `${activeCompanyId}/${importacaoId}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from('nr1-importacoes-matriz')
        .upload(storagePath, arquivo, {
          contentType: arquivo.type || `application/octet-stream`,
          upsert: false,
        });
      if (upErr) throw upErr;

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
      });
      if (insErr) {
        // rollback do arquivo se o insert falhar
        await supabase.storage.from('nr1-importacoes-matriz').remove([storagePath]);
        throw insErr;
      }

      toast.success('Importação registrada', {
        description: 'Nossa equipe fará o mapeamento dos fatores em até 2 dias úteis.',
      });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      console.error('Erro ao importar matriz', e);
      const msg = e?.message?.includes('row-level security')
        ? 'Você não tem permissão para registrar importações nesta empresa.'
        : e?.message?.includes('Payload')
        ? 'Arquivo muito grande para envio.'
        : e?.message ?? 'Falha ao enviar a matriz. Tente novamente.';
      toast.error('Erro no envio', { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const meta = METODOLOGIAS.find(m => m.id === metodologia)!;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 nr1-text-primary" />
            Importar Matriz de Risco Externa
          </DialogTitle>
          <DialogDescription>
            Já possui um diagnóstico psicossocial pronto? Importe sua matriz de risco e a CompSmart converte para o padrão COPSOQ-III (13 fatores) para gerar PGR, planos de ação e relatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Alert className="border-[hsl(var(--nr1-primary)/0.3)] nr1-bg-soft">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Como funciona:</strong> escolha a metodologia usada, anexe o arquivo (Excel, CSV ou PDF) e nossa equipe faz o <strong>de-para</strong> dos fatores externos para o padrão COPSOQ-III/NR-1, preservando severidade e probabilidade originais.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">1. Metodologia utilizada no diagnóstico</Label>
            <RadioGroup value={metodologia} onValueChange={(v) => setMetodologia(v as Metodologia)} className="space-y-2">
              {METODOLOGIAS.map((m) => (
                <label
                  key={m.id}
                  htmlFor={`met-${m.id}`}
                  className={`flex items-start gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                    metodologia === m.id ? 'border-[hsl(var(--nr1-primary))] nr1-bg-soft' : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
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
              <Input
                id="met-outra"
                value={metodologiaOutra}
                onChange={(e) => setMetodologiaOutra(e.target.value)}
                placeholder="Ex.: Metodologia própria XYZ"
                maxLength={120}
              />
            </div>
          )}

          {metodologia !== 'COPSOQ-III' && (
            <Alert className="border-amber-300 bg-amber-50">
              <ArrowRight className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Mapeamento automático:</strong> aplicaremos a tabela de de-para <strong>{meta.nome} ↔ COPSOQ-III</strong>. Fatores sem equivalente direto serão sinalizados para validação humana antes da publicação do PGR.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold">2. Arquivo da matriz de risco *</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/pdf"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
                disabled={submitting}
              />
              {arquivo && (
                <Badge variant="outline" className="shrink-0 gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  {(arquivo.size / 1024).toFixed(0)} KB
                  <button
                    type="button"
                    onClick={() => handleFileChange(null)}
                    className="ml-1 hover:text-destructive"
                    aria-label="Remover arquivo"
                  >
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
              <p className="text-[11px] text-muted-foreground">Formatos aceitos: Excel (.xlsx, .xls), CSV ou PDF — máx. 20 MB.</p>
            )}
          </div>

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
            <Textarea id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} maxLength={2000} placeholder="Ex.: pesquisa aplicada apenas nas unidades fabris; população amostral de 320 colaboradores..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || !arquivo} className="nr1-bg-primary">
            {submitting ? 'Enviando...' : 'Enviar para mapeamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
