import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileSpreadsheet, FileText, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Nr1EmptyState } from '@/components/nr1/Nr1EmptyState';
import { Nr1ImportarMatrizDialog } from '@/components/nr1/Nr1ImportarMatrizDialog';
import { Nr1ImportacaoDetalhe, STATUS_CLASSE, STATUS_LABEL } from '@/components/nr1/Nr1ImportacaoDetalhe';
import { statusConferencia, useNr1Importacoes, type Nr1Importacao } from '@/hooks/useNr1Importacoes';
import { exportToCSV } from '@/lib/csvExport';
import { aplicarFonteUnicode } from '@/lib/pdfFont';
import { formatDateBRFromISODate } from '@/lib/date';

const metod = (i: Nr1Importacao) => (i.metodologia === 'OUTRA' ? `Outra${i.metodologia_outra ? ` (${i.metodologia_outra})` : ''}` : i.metodologia);
const dataBR = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

export default function Nr1Importacoes() {
  const { data, isLoading } = useNr1Importacoes();
  const [status, setStatus] = useState<'todos' | 'pendente' | 'conferido' | 'rejeitado'>('todos');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [sel, setSel] = useState<Nr1Importacao | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const lista = useMemo(() => (data ?? []).filter((i) => {
    const d = i.created_at.slice(0, 10);
    return (status === 'todos' || statusConferencia(i.status) === status) && (!inicio || d >= inicio) && (!fim || d <= fim);
  }), [data, status, inicio, fim]);

  const periodo = `${inicio ? formatDateBRFromISODate(inicio) : 'início'} a ${fim ? formatDateBRFromISODate(fim) : 'hoje'}`;
  const metodo = [
    'Importações de Matriz de Risco NR-1 — fatores de risco, sem dados pessoais.',
    `Período: ${periodo}. Filtro de status: ${status === 'todos' ? 'todos' : STATUS_LABEL[status]}.`,
    'O mínimo de 5 respondentes (k=5) não se aplica a esta área: a matriz traz fatores de risco, não respostas de pessoas. Por isso não há nota de saúde nem selo aqui.',
  ];
  const cab = ['Arquivo', 'Metodologia', 'Data', 'Status', 'Consultoria'];
  const linha = (i: Nr1Importacao) => [i.arquivo_nome ?? 'Texto livre', metod(i), dataBR(i.created_at), STATUS_LABEL[statusConferencia(i.status)], i.consultoria ?? '—'];

  const exportarCSV = () => exportToCSV('nr1-importacoes-matriz', cab.map((h, k) => ({ header: h, accessor: (r: string[]) => r[k] })), lista.map(linha), ';', metodo);
  const exportarPDF = async () => {
    const doc = new jsPDF();
    const fonte = await aplicarFonteUnicode(doc);
    doc.setFontSize(14); doc.text('Importações de Matriz de Risco NR-1', 14, 16);
    doc.setFontSize(8);
    let y = 23;
    metodo.forEach((t) => { const ls = doc.splitTextToSize(t, 182); doc.text(ls, 14, y); y += ls.length * 4; });
    autoTable(doc, { startY: y + 2, head: [cab], body: lista.map(linha), styles: { font: fonte, fontSize: 8 }, headStyles: { font: fonte } });
    doc.save('nr1-importacoes-matriz.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Importações da Matriz</h2>
          <p className="text-sm text-muted-foreground">Confira o arquivo e o mapeamento de cada matriz importada e registre a conferência.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportarPDF} disabled={!lista.length}><FileText className="mr-1 h-4 w-4" />PDF</Button>
          <Button variant="outline" size="sm" onClick={exportarCSV} disabled={!lista.length}><FileSpreadsheet className="mr-1 h-4 w-4" />Planilha</Button>
          <Button size="sm" onClick={() => setImportOpen(true)}><Upload className="mr-1 h-4 w-4" />Importar matriz</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="conferido">Conferido</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label htmlFor="ini">De</Label><Input id="ini" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="fim">Até</Label><Input id="fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></div>
        </CardContent>
      </Card>

      {isLoading ? <Skeleton className="h-40 w-full" /> : !data?.length ? (
        <div className="space-y-3 text-center">
          <Nr1EmptyState titulo="Nenhuma importação ainda" descricao="Importe uma matriz de risco existente para conferir o arquivo e o mapeamento aqui." />
          <Button onClick={() => setImportOpen(true)}><Upload className="mr-1 h-4 w-4" />Importar matriz</Button>
        </div>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left"><tr>{[...cab, ''].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {lista.map((i) => {
                  const st = statusConferencia(i.status);
                  return (
                    <tr key={i.id} className="border-t">
                      <td className="max-w-[220px] truncate p-3">{i.arquivo_nome ?? 'Texto livre'}</td>
                      <td className="p-3">{metod(i)}</td>
                      <td className="p-3">{dataBR(i.created_at)}</td>
                      <td className="p-3"><Badge variant="outline" className={`rounded-full ${STATUS_CLASSE[st]}`}>{STATUS_LABEL[st]}</Badge></td>
                      <td className="p-3">{i.consultoria ?? '—'}</td>
                      <td className="p-3 text-right"><Button size="sm" variant="outline" onClick={() => setSel(i)}>{st === 'pendente' ? 'Conferir' : 'Detalhes'}</Button></td>
                    </tr>
                  );
                })}
                {!lista.length && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma importação neste filtro.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      <Nr1ImportacaoDetalhe item={sel} onClose={() => setSel(null)} />
      <Nr1ImportarMatrizDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
