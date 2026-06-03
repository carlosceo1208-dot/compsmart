import { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useNr1TerceiroPgrs, useUploadPgr, downloadPgr, statusFromVencimento } from '@/hooks/useNr1Terceiros';
import type { Terceiro } from '@/hooks/useNr1Terceiros';
import { toast } from 'sonner';
import { formatCnpj } from '@/lib/cnpj';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  terceiro: Terceiro | null;
}

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

function nextVersion(versions: string[]): string {
  if (!versions.length) return 'v1.0';
  const nums = versions
    .map((v) => parseFloat(v.replace(/^v/i, '')))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `v${(Math.floor(max) + 1).toFixed(1)}`;
}

export function TerceiroPgrSheet({ open, onOpenChange, terceiro }: Props) {
  const { data: pgrs = [], isLoading } = useNr1TerceiroPgrs(terceiro?.id ?? null);
  const upload = useUploadPgr();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dataEmissao, setDataEmissao] = useState('');
  const [dataVenc, setDataVenc] = useState('');
  const [obs, setObs] = useState('');

  if (!terceiro) return null;
  const latest = pgrs[0];
  const status = statusFromVencimento(latest?.data_vencimento ?? null);

  const onPick = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_BYTES) { toast.error('Arquivo excede 50MB'); return; }
    if (!ALLOWED.includes(f.type) && !/\.(pdf|docx?)$/i.test(f.name)) {
      toast.error('Formato não suportado (PDF, DOC, DOCX)'); return;
    }
    setFile(f);
  };

  const onSend = async () => {
    if (!file) { toast.error('Selecione um arquivo'); return; }
    await upload.mutateAsync({
      terceiroId: terceiro.id,
      file,
      versao: nextVersion(pgrs.map((p) => p.versao)),
      data_emissao: dataEmissao || undefined,
      data_vencimento: dataVenc || undefined,
      observacoes: obs || undefined,
    });
    setFile(null); setDataEmissao(''); setDataVenc(''); setObs('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const StatusBadge = () => {
    if (status === 'ok') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300"><CheckCircle2 className="h-3 w-3 mr-1" />Válido</Badge>;
    if (status === 'vencendo') return <Badge className="bg-amber-100 text-amber-700 border-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />Vence em ≤30d</Badge>;
    if (status === 'vencido') return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Vencido</Badge>;
    return <Badge variant="outline">Sem PGR</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestão de PGR</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="font-semibold text-sm">{terceiro.razao_social}</p>
            <p className="text-xs text-muted-foreground">CNPJ {formatCnpj(terceiro.cnpj)}</p>
            <div className="mt-2"><StatusBadge /></div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><Upload className="h-4 w-4" />Novo PGR</p>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0])}
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                {file ? file.name : 'Selecionar arquivo (PDF/DOC/DOCX · 50MB)'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data de emissão</Label>
                <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Data de vencimento</Label>
                <Input type="date" value={dataVenc} onChange={(e) => setDataVenc(e.target.value)} />
              </div>
            </div>
            <Input placeholder="Observações (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
            <Button onClick={onSend} disabled={!file || upload.isPending} className="w-full">
              {upload.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Enviar PGR
            </Button>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Histórico (últimas versões)</p>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : pgrs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum PGR cadastrado.</p>
            ) : (
              <ul className="space-y-2">
                {pgrs.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 border rounded-md p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.versao} · {p.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Enviado {new Date(p.created_at).toLocaleDateString('pt-BR')}
                          {p.data_vencimento ? ` · Vence ${new Date(p.data_vencimento).toLocaleDateString('pt-BR')}` : ''}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => downloadPgr(p.file_path, p.file_name)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
