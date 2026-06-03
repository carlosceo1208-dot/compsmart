import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Building2, Plus, Search, MoreVertical, Pencil, Trash2, FileText, FileCheck2,
  CheckCircle2, AlertTriangle, XCircle, Loader2,
} from 'lucide-react';
import {
  useNr1Terceiros, useDeleteTerceiro, statusFromVencimento, type Terceiro, type TerceiroPgr,
} from '@/hooks/useNr1Terceiros';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCnpj } from '@/lib/cnpj';
import { TerceiroFormDialog } from './TerceiroFormDialog';
import { TerceiroPgrSheet } from './TerceiroPgrSheet';
import { gerarRelatorioConformidadePdf } from '@/lib/nr1TerceirosReport';
import { toast } from 'sonner';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export function Nr1TerceirosDialog({ open, onOpenChange }: Props) {
  const { activeCompany } = useCompanyContext();
  const { data: terceiros = [], isLoading } = useNr1Terceiros();
  const del = useDeleteTerceiro();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Terceiro | null>(null);
  const [pgrOpen, setPgrOpen] = useState(false);
  const [pgrTarget, setPgrTarget] = useState<Terceiro | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = q
      ? terceiros.filter((t) =>
          t.razao_social.toLowerCase().includes(q) ||
          (t.nome_fantasia ?? '').toLowerCase().includes(q) ||
          t.cnpj.includes(q.replace(/\D/g, '')),
        )
      : terceiros;
    const order = { vencido: 0, vencendo: 1, sem_pgr: 2, ok: 3 } as const;
    return [...arr].sort(() => 0); // status order is computed per-row via latest_pgr; keep alpha by default
  }, [terceiros, search]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (t: Terceiro) => { setEditing(t); setFormOpen(true); };
  const openPgr = (t: Terceiro) => { setPgrTarget(t); setPgrOpen(true); };

  const handleReport = async (t: Terceiro) => {
    const { data, error } = await (supabase as any)
      .from('nr1_terceiros_pgr')
      .select('*')
      .eq('terceiro_id', t.id)
      .order('created_at', { ascending: false });
    if (error) { toast.error('Erro ao carregar PGRs'); return; }
    gerarRelatorioConformidadePdf({
      empresaCliente: activeCompany?.name ?? '—',
      terceiro: t,
      pgrs: (data ?? []) as TerceiroPgr[],
    });
  };

  const handleDelete = async (t: Terceiro) => {
    if (!confirm(`Remover ${t.razao_social}?`)) return;
    await del.mutateAsync(t.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[hsl(var(--nr1-primary))]" />
            Gestão de Terceiros · NR-1
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa terceira (nome ou CNPJ)..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />Adicionar nova empresa
          </Button>
        </div>

        <div className="mt-3 flex-1 overflow-auto border rounded-md">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {search ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa terceira cadastrada ainda.'}
              {!search && (
                <div className="mt-3">
                  <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Cadastrar a primeira</Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t, idx) => (
                  <TerceiroRow
                    key={t.id}
                    idx={idx + 1}
                    terceiro={t}
                    onEdit={() => openEdit(t)}
                    onPgr={() => openPgr(t)}
                    onReport={() => handleReport(t)}
                    onDelete={() => handleDelete(t)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <TerceiroFormDialog open={formOpen} onOpenChange={setFormOpen} terceiro={editing} />
        <TerceiroPgrSheet open={pgrOpen} onOpenChange={setPgrOpen} terceiro={pgrTarget} />
      </DialogContent>
    </Dialog>
  );
}

function TerceiroRow({
  idx, terceiro, onEdit, onPgr, onReport, onDelete,
}: {
  idx: number; terceiro: Terceiro;
  onEdit: () => void; onPgr: () => void; onReport: () => void; onDelete: () => void;
}) {
  // We don't preload PGRs; fetch latest vencimento inline via the hook isn't ideal here,
  // so we render generic until row opened. Use a tiny query for latest.
  const [latestVenc, setLatestVenc] = useLatestVencimento(terceiro.id);
  const status = statusFromVencimento(latestVenc);

  const Status = () => {
    if (status === 'ok') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300"><CheckCircle2 className="h-3 w-3 mr-1" />Ativo</Badge>;
    if (status === 'vencendo') return <Badge className="bg-amber-100 text-amber-700 border-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />Vence ≤30d</Badge>;
    if (status === 'vencido') return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Vencido</Badge>;
    return <Badge variant="outline">Sem PGR</Badge>;
  };

  return (
    <TableRow>
      <TableCell className="text-muted-foreground text-xs">{idx}</TableCell>
      <TableCell>
        <div className="font-medium text-sm">{terceiro.razao_social}</div>
        {terceiro.nome_fantasia && <div className="text-xs text-muted-foreground">{terceiro.nome_fantasia}</div>}
      </TableCell>
      <TableCell className="text-xs font-mono">{formatCnpj(terceiro.cnpj)}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{terceiro.area_atuacao ?? '—'}</TableCell>
      <TableCell><Status /></TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={onPgr}><FileText className="h-4 w-4 mr-2" />Gerir PGR</DropdownMenuItem>
            <DropdownMenuItem onClick={onReport}><FileCheck2 className="h-4 w-4 mr-2" />Relatório de Conformidade</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// Helper hook: fetch latest PGR vencimento for a row (small query).
import { useEffect, useState as useReactState } from 'react';
function useLatestVencimento(terceiroId: string): [string | null, (v: string | null) => void] {
  const [v, setV] = useReactState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('nr1_terceiros_pgr')
        .select('data_vencimento')
        .eq('terceiro_id', terceiroId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setV(data?.data_vencimento ?? null);
    })();
    return () => { cancelled = true; };
  }, [terceiroId]);
  return [v, setV];
}
