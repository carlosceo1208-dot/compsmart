import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, FileDown, XCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { parsearTextoMatriz } from '@/lib/nr1MatrizParser';
import { abrirArquivoImportacao, statusConferencia, useConferirImportacao, type Nr1Importacao } from '@/hooks/useNr1Importacoes';

export const motivoSchema = z.string().trim().min(3, 'Informe o motivo (mínimo 3 caracteres).').max(1000, 'Máximo de 1000 caracteres.');

export const STATUS_LABEL = { pendente: 'Pendente', conferido: 'Conferido', rejeitado: 'Rejeitado' } as const;
export const STATUS_CLASSE = {
  pendente: 'border-warning/40 bg-warning-light text-foreground',
  conferido: 'border-success/40 bg-success/10 text-success',
  rejeitado: 'border-destructive/40 bg-destructive/10 text-destructive',
} as const;

const fmt = (v: unknown) => (v == null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

export function Nr1ImportacaoDetalhe({ item, onClose }: { item: Nr1Importacao | null; onClose: () => void }) {
  const conferir = useConferirImportacao();
  const [rejeitando, setRejeitando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erroMotivo, setErroMotivo] = useState<string | null>(null);
  if (!item) return null;
  const st = statusConferencia(item.status);
  const res = item.mapeamento_resultado ?? {};
  const mapa = Object.entries(item.mapeamento_aplicado ?? {}).filter(([, v]) => v != null && v !== '');
  const reparse = item.texto_livre ? parsearTextoMatriz(item.texto_livre) : null;
  const avisos = reparse?.ok ? reparse.data.warnings : [];

  const acao = async (status: 'conferido' | 'rejeitado', m?: string) => {
    try {
      await conferir.mutateAsync({ id: item.id, status, motivo: m });
      toast.success(status === 'conferido' ? 'Importação conferida.' : 'Importação rejeitada.');
      setRejeitando(false); setMotivo(''); onClose();
    } catch (e) {
      toast.error((e as Error).message || 'Não foi possível atualizar.');
    }
  };

  const confirmarRejeicao = () => {
    const r = motivoSchema.safeParse(motivo);
    if (!r.success) { setErroMotivo(r.error.issues[0].message); return; }
    acao('rejeitado', r.data);
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="break-words">{item.arquivo_nome ?? 'Texto livre'}</SheetTitle>
          <SheetDescription>
            {item.metodologia === 'OUTRA' ? item.metodologia_outra ?? 'Outra' : item.metodologia} · {new Date(item.created_at).toLocaleDateString('pt-BR')}
            {item.consultoria ? ` · ${item.consultoria}` : ''}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-5 text-sm">
          <Badge variant="outline" className={`rounded-full ${STATUS_CLASSE[st]}`}>{STATUS_LABEL[st]}</Badge>
          {st === 'rejeitado' && item.motivo_rejeicao && <p className="rounded-md border p-3"><strong>Motivo:</strong> {item.motivo_rejeicao}</p>}

          <section>
            <h3 className="mb-2 font-semibold">Resumo da leitura</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Linhas: {fmt(res.total_rows ?? res.total_linhas)}</Badge>
              <Badge variant="outline">Colunas: {fmt(res.total_cols)}</Badge>
              {res.delimitador && <Badge variant="outline">Separador: {fmt((res.delimitador as any)?.char ?? res.delimitador)}</Badge>}
            </div>
            {avisos.length > 0 && <ul className="mt-2 list-disc pl-5 text-muted-foreground">{avisos.map((a) => <li key={a}>{a}</li>)}</ul>}
          </section>

          <section>
            <h3 className="mb-2 font-semibold">Mapeamento aplicado</h3>
            {mapa.length ? (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50"><tr><th className="p-2 text-left">Coluna externa / campo</th><th className="p-2 text-left">Campo CompSmart / coluna</th></tr></thead>
                  <tbody>{mapa.map(([k, v]) => <tr key={k} className="border-t"><td className="p-2">{k}</td><td className="p-2">{fmt(v)}</td></tr>)}</tbody>
                </table>
              </div>
            ) : <p className="text-muted-foreground">Sem mapeamento estruturado (texto livre ou mapeamento manual).</p>}
          </section>

          {item.arquivo_path && (
            <Button variant="outline" size="sm" onClick={() => abrirArquivoImportacao(item.arquivo_path!).catch(() => toast.error('Arquivo indisponível.'))}>
              <FileDown className="mr-1 h-4 w-4" />Abrir arquivo original (link válido por 10 min)
            </Button>
          )}
          {item.texto_livre && (
            <section>
              <h3 className="mb-2 font-semibold">Conteúdo enviado</h3>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs">{item.texto_livre}</pre>
            </section>
          )}

          {st === 'pendente' && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={() => acao('conferido')} disabled={conferir.isPending}><CheckCircle2 className="mr-1 h-4 w-4" />Marcar como conferido</Button>
              <Button variant="destructive" onClick={() => setRejeitando(true)} disabled={conferir.isPending}><XCircle className="mr-1 h-4 w-4" />Rejeitar</Button>
            </div>
          )}
        </div>

        <Dialog open={rejeitando} onOpenChange={setRejeitando}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar importação</DialogTitle>
              <DialogDescription>O motivo é obrigatório e fica registrado. Esta ação não pode ser desfeita.</DialogDescription>
            </DialogHeader>
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea id="motivo" value={motivo} maxLength={1000} onChange={(e) => { setMotivo(e.target.value); setErroMotivo(null); }} />
            {erroMotivo && <p className="text-sm text-destructive">{erroMotivo}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejeitando(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmarRejeicao} disabled={conferir.isPending}>Confirmar rejeição</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
