import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, CheckCircle, AlertTriangle, Copy, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SalaryTableDialog } from './SalaryTableDialog';
import { useCompanyContext } from '@/contexts/CompanyContext';

interface SalaryTable {
  id: string;
  name: string;
  effective_month: number;
  effective_year: number;
  is_active: boolean;
  is_template: boolean;
  ranges_count?: number;
}

interface SalaryTableManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTableActivated?: () => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function SalaryTableManager({ open, onOpenChange, onTableActivated }: SalaryTableManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  const [tables, setTables] = useState<SalaryTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<SalaryTable | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  useEffect(() => {
    if (open && activeCompanyId) {
      fetchTables();
    }
  }, [open, activeCompanyId]);

  const fetchTables = async () => {
    if (!activeCompanyId) return;
    
    setLoading(true);
    try {
      // Fetch tables with range count using activeCompanyId from context
      const { data: tablesData, error } = await supabase
        .from('salary_tables')
        .select('id, name, effective_month, effective_year, is_active, is_template')
        .or(`root_company_id.eq.${activeCompanyId},is_template.eq.true`)
        .order('is_template', { ascending: true })
        .order('is_active', { ascending: false })
        .order('effective_year', { ascending: false })
        .order('effective_month', { ascending: false });

      if (error) throw error;

      // Get range counts for each table
      const tablesWithCounts = await Promise.all(
        (tablesData || []).map(async (table) => {
          const { count } = await supabase
            .from('salary_ranges')
            .select('*', { count: 'exact', head: true })
            .eq('salary_table_id', table.id);
          
          return { ...table, ranges_count: count || 0 };
        })
      );

      setTables(tablesWithCounts);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tabelas salariais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (tableId: string) => {
    setActivating(tableId);
    try {
      const { error } = await supabase
        .from('salary_tables')
        .update({ is_active: true })
        .eq('id', tableId);

      if (error) throw error;

      toast({
        title: 'Tabela ativada',
        description: 'A tabela salarial foi ativada com sucesso.',
      });

      // Invalidate cache to update dashboard alert
      queryClient.invalidateQueries({ queryKey: ['salary-table-status'] });

      await fetchTables();
      onTableActivated?.();
    } catch (error) {
      console.error('Error activating table:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar a tabela.',
        variant: 'destructive',
      });
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async () => {
    if (!tableToDelete) return;

    try {
      // First delete all ranges
      await supabase
        .from('salary_ranges')
        .delete()
        .eq('salary_table_id', tableToDelete.id);

      // Then delete the table
      const { error } = await supabase
        .from('salary_tables')
        .delete()
        .eq('id', tableToDelete.id);

      if (error) throw error;

      toast({
        title: 'Tabela excluída',
        description: 'A tabela salarial foi excluída com sucesso.',
      });

      await fetchTables();
      onTableActivated?.();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tabela.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setTableToDelete(null);
    }
  };

  const handleEdit = (tableId: string) => {
    setEditingTableId(tableId);
    setEditDialogOpen(true);
  };

  const handleCloneTemplate = async (template: SalaryTable) => {
    if (!activeCompanyId) return;
    setActivating(template.id);
    try {
      // 1) Check if company already has an active table
      const { data: existingActive } = await supabase
        .from('salary_tables')
        .select('id')
        .eq('root_company_id', activeCompanyId)
        .eq('is_active', true)
        .eq('is_template', false)
        .limit(1);
      const shouldActivate = !existingActive || existingActive.length === 0;

      // 2) Create a new table copy for the active company.
      // The database has a global unique constraint on `name`, and RLS can hide
      // same-name rows from other companies. So do not rely on a pre-check here:
      // always generate a unique, readable name and retry only on a rare collision.
      const buildCloneName = (attempt: number) => {
        const randomPart =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);

        return `${template.name} (cópia ${Date.now().toString(36)}-${randomPart}${attempt > 0 ? `-${attempt + 1}` : ''})`;
      };

      let newTable: { id: string } | null = null;
      let createErr: any = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from('salary_tables')
          .insert({
            name: buildCloneName(attempt),
            effective_month: template.effective_month,
            effective_year: template.effective_year,
            is_active: shouldActivate,
            is_template: false,
            root_company_id: activeCompanyId,
          })
          .select('id')
          .single();

        if (!error && data) {
          newTable = data;
          createErr = null;
          break;
        }

        createErr = error;
        if (error?.code !== '23505') break;
      }

      if (createErr || !newTable) throw createErr ?? new Error('Não foi possível criar a cópia da tabela.');


      // 2) Copy ranges
      const { data: srcRanges, error: rangesErr } = await supabase
        .from('salary_ranges')
        .select('grade, calculation_mode, min_value, q1_value, median_value, q3_value, max_value, input_median, input_amplitude, reference_points')
        .eq('salary_table_id', template.id);
      if (rangesErr) throw rangesErr;

      if (srcRanges && srcRanges.length > 0) {
        const payload = srcRanges.map((r) => ({ ...r, salary_table_id: newTable.id }));
        const { error: insErr } = await supabase.from('salary_ranges').insert(payload);
        if (insErr) throw insErr;
      }

      toast({
        title: 'Modelo clonado',
        description: `Uma cópia editável foi criada na sua empresa (${srcRanges?.length ?? 0} faixas).`,
      });

      queryClient.invalidateQueries({ queryKey: ['salary-table-status'] });
      await fetchTables();
      onTableActivated?.();
    } catch (error: any) {
      console.error('Error cloning template:', error);
      toast({
        title: 'Erro ao clonar',
        description: error?.message ?? 'Não foi possível clonar o modelo.',
        variant: 'destructive',
      });
    } finally {
      setActivating(null);
    }
  };

  const hasActiveTable = tables.some(t => t.is_active && !t.is_template);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Gerenciar Tabelas Salariais</span>
              <Button size="sm" onClick={() => { setEditingTableId(null); setEditDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Tabela
              </Button>
            </DialogTitle>
          </DialogHeader>

          {!hasActiveTable && tables.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">
                Nenhuma tabela ativa! Ative uma tabela para usar na análise salarial e People Analytics.
              </span>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : tables.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-4">Nenhuma tabela salarial cadastrada.</p>
              <Button onClick={() => { setEditingTableId(null); setEditDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Tabela
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead className="text-center">Faixas</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.id} className={table.is_template ? 'bg-muted/30' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {table.is_template && <BookOpen className="w-4 h-4 text-primary" />}
                          <span>{table.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {MONTHS[table.effective_month - 1]}/{table.effective_year}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{table.ranges_count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {table.is_template ? (
                          <Badge className="bg-primary/15 text-primary border-primary/30">
                            <BookOpen className="w-3 h-3 mr-1" />
                            Modelo global
                          </Badge>
                        ) : table.is_active ? (
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inativa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {table.is_template ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCloneTemplate(table)}
                              disabled={activating === table.id}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              {activating === table.id ? 'Clonando...' : 'Clonar para minha empresa'}
                            </Button>
                          ) : (
                            <>
                              {!table.is_active && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                  onClick={() => handleActivate(table.id)}
                                  disabled={activating === table.id}
                                >
                                  {activating === table.id ? 'Ativando...' : 'Ativar'}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(table.id)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => { setTableToDelete(table); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SalaryTableDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        tableId={editingTableId}
        onSuccess={() => {
          fetchTables();
          onTableActivated?.();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tabela Salarial</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tabela "{tableToDelete?.name}"?
              {tableToDelete?.ranges_count && tableToDelete.ranges_count > 0 && (
                <span className="block mt-2 font-medium text-destructive">
                  Esta tabela possui {tableToDelete.ranges_count} faixas salariais que também serão excluídas.
                </span>
              )}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
