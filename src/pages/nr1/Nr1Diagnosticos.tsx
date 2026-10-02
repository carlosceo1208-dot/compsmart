import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClipboardList, Download, FileSpreadsheet, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteNr1Diagnostico, useNr1Diagnosticos, useUpdateNr1Diagnostico } from '@/hooks/useNr1';
import { Nr1SeloSaude, Nr1SeloRodape } from '@/components/nr1/Nr1SeloSaude';
import { Nr1ComparadorCiclos } from '@/components/nr1/Nr1ComparadorCiclos';
import { K_MINIMO, notaSaude, seloSaude } from '@/lib/nr1Selo';
import { formatDateBRFromISODate } from '@/lib/date';
import { exportToCSV } from '@/lib/csvExport';
import { aplicarFonteUnicode } from '@/lib/pdfFont';

type Diag = NonNullable<ReturnType<typeof useNr1Diagnosticos>['data']>[number];

const temNota = (d: Diag) => (d.total_respondentes ?? 0) >= K_MINIMO && d.score_geral != null;
const periodoTexto = (d: Diag) =>
  `${formatDateBRFromISODate(d.periodo_inicio)} → ${d.periodo_fim ? formatDateBRFromISODate(d.periodo_fim) : 'em andamento'}`;

export default function Nr1Diagnosticos() {
  const { data, isLoading } = useNr1Diagnosticos();
  const updateMut = useUpdateNr1Diagnostico();
  const deleteMut = useDeleteNr1Diagnostico();
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [editing, setEditing] = useState<{ id: string; nome: string } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; nome: string } | null>(null);

  const filtrados = useMemo(
    () => (data ?? []).filter((d) => {
      const fimCiclo = d.periodo_fim ?? '9999-12-31';
      return (!inicio || fimCiclo >= inicio) && (!fim || d.periodo_inicio <= fim);
    }),
    [data, inicio, fim],
  );

  const periodoFiltro = `${inicio ? formatDateBRFromISODate(inicio) : 'início'} a ${fim ? formatDateBRFromISODate(fim) : 'hoje'}`;
  const metodo = [
    'Histórico de Diagnósticos NR-1 — dados agregados, sem identificação de pessoas.',
    `Período filtrado: ${periodoFiltro}.`,
    'Nota de saúde = 100 − risco psicossocial (COPSOQ-III). Selo: ≥70 Saudável, 55–69 Atenção, <55 Crítico.',
    `Mínimo de ${K_MINIMO} respondentes (k=5): abaixo disso o ciclo aparece como "Dados insuficientes", sem nota nem selo.`,
  ];
  const linha = (d: Diag) => {
    const s = temNota(d) ? notaSaude(d.score_geral) : null;
    return [
      d.ciclo_nome,
      periodoTexto(d),
      String(d.total_respondentes ?? 0),
      s == null ? 'Dados insuficientes' : s.toFixed(1).replace('.', ','),
      s == null ? 'Dados insuficientes' : seloSaude(s)?.label ?? '',
      d.status.replace('_', ' '),
    ];
  };
  const cab = ['Ciclo', 'Período', 'Respondentes', 'Nota de saúde', 'Selo', 'Status'];

  const exportarCSV = () =>
    exportToCSV('nr1-historico-diagnosticos', cab.map((h, i) => ({ header: h, accessor: (r: string[]) => r[i] })), filtrados.map(linha), ';', metodo);

  const exportarPDF = async () => {
    const doc = new jsPDF();
    const fonte = await aplicarFonteUnicode(doc);
    doc.setFontSize(14);
    doc.text('Histórico de Diagnósticos NR-1', 14, 16);
    doc.setFontSize(8);
    let y = 23;
    metodo.slice(1).forEach((t) => {
      const ls = doc.splitTextToSize(t, 182);
      doc.text(ls, 14, y);
      y += ls.length * 4;
    });
    autoTable(doc, { startY: y + 2, head: [cab], body: filtrados.map(linha), styles: { font: fonte, fontSize: 8 }, headStyles: { font: fonte } });
    doc.save('nr1-historico-diagnosticos.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-semibold">Histórico de Diagnósticos</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportarCSV} disabled={!filtrados.length}><FileSpreadsheet className="h-4 w-4 mr-1" />Planilha</Button>
          <Button variant="outline" size="sm" onClick={exportarPDF} disabled={!filtrados.length}><Download className="h-4 w-4 mr-1" />PDF</Button>
          <Button asChild size="sm" className="nr1-bg-primary">
            <Link to="/nr1/diagnostico/novo"><Plus className="h-4 w-4 mr-1" />Novo ciclo</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center space-y-3">
            <p className="text-muted-foreground">Nenhum diagnóstico ainda. Inicie o primeiro ciclo.</p>
            <Button asChild className="nr1-bg-primary"><Link to="/nr1/diagnostico/novo"><Plus className="h-4 w-4 mr-1" />Novo ciclo</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 sm:max-w-md">
            <div className="space-y-1">
              <Label htmlFor="hist-inicio" className="text-xs">Início do período</Label>
              <Input id="hist-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hist-fim" className="text-xs">Fim do período</Label>
              <Input id="hist-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3">
            {filtrados.length === 0 && <p className="text-sm text-muted-foreground">Nenhum ciclo no período escolhido.</p>}
            {filtrados.map((d) => (
              <Card key={d.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base break-words">{d.ciclo_nome}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Período: {periodoTexto(d)}</p>
                  </div>
                  {temNota(d) && <Nr1SeloSaude risco={d.score_geral} className="shrink-0" />}
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-x-6 gap-y-1 text-sm text-muted-foreground flex-wrap">
                    <span>Respondentes: <strong className="text-foreground">{d.total_respondentes ?? 0}</strong></span>
                    {!temNota(d) && <strong className="text-foreground">Dados insuficientes (menos de {K_MINIMO} respostas)</strong>}
                    <span className="capitalize">Status: {d.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/nr1/diagnostico/${d.id}`}><FileText className="h-4 w-4 mr-1" />Abrir</Link>
                    </Button>
                    {(d.total_respondentes ?? 0) > 0 && (
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Plano de ação" aria-label="Plano de ação">
                        <Link to={`/nr1/diagnostico/${d.id}#plano-acao`}><ClipboardList className="h-4 w-4" /></Link>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Renomear" aria-label="Renomear" onClick={() => setEditing({ id: d.id, nome: d.ciclo_nome })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Excluir" aria-label="Excluir" onClick={() => setDeleting({ id: d.id, nome: d.ciclo_nome })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Nr1SeloRodape />
          </div>

          <Card>
            <CardContent className="pt-6">
              <Nr1ComparadorCiclos ciclos={data} />
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear ciclo</DialogTitle>
            <DialogDescription>Atualize o nome do ciclo de diagnóstico.</DialogDescription>
          </DialogHeader>
          <Input value={editing?.nome ?? ''} onChange={(e) => setEditing((s) => (s ? { ...s, nome: e.target.value } : s))} placeholder="Ex.: Maio 2026" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="nr1-bg-primary" disabled={!editing?.nome?.trim() || updateMut.isPending}
              onClick={async () => { if (!editing) return; await updateMut.mutateAsync({ id: editing.id, ciclo_nome: editing.nome.trim() }); setEditing(null); }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ciclo "{deleting?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todas as respostas associadas serão removidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { if (!deleting) return; await deleteMut.mutateAsync(deleting.id); setDeleting(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
