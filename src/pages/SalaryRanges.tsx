import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Calculator, TrendingUp, Upload, Settings } from 'lucide-react';
import { SalaryRangeDialog } from '@/components/SalaryRangeDialog';
import { SalaryTableDialog } from '@/components/SalaryTableDialog';
import { SalaryTableSelector } from '@/components/SalaryTableSelector';
import { SalaryBulkImport } from '@/components/SalaryBulkImport';
import { useLabels } from '@/contexts/LabelsContext';

interface SalaryRange {
  id: string;
  grade: string;
  calculation_mode: 'manual' | 'automatic';
  min_value: number;
  q1_value: number;
  median_value: number;
  q3_value: number;
  max_value: number;
}

export default function SalaryRanges() {
  const { getLabel } = useLabels();
  const [ranges, setRanges] = useState<SalaryRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  useEffect(() => {
    fetchRanges();
  }, [selectedTableId]);

  const fetchRanges = async () => {
    if (!selectedTableId) {
      setRanges([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('salary_ranges')
        .select('*')
        .eq('salary_table_id', selectedTableId)
        .order('grade');

      if (error) throw error;
      setRanges(data || []);
    } catch (error) {
      console.error('Error fetching salary ranges:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Tabela Salarial</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as faixas salariais por {getLabel('grade').toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTableDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar Tabelas
          </Button>
          <Button variant="outline" onClick={() => setBulkImportOpen(true)} disabled={!selectedTableId}>
            <Upload className="w-4 h-4 mr-2" />
            Importação em Massa
          </Button>
          <Button onClick={() => { setSelectedGrade(null); setDialogOpen(true); }} disabled={!selectedTableId}>
            <Plus className="w-4 h-4 mr-2" />
            Nova {getLabel('salary_range')}
          </Button>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <SalaryTableSelector value={selectedTableId} onChange={setSelectedTableId} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {!selectedTableId ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Selecione uma tabela salarial para visualizar as faixas
              </p>
              <Button onClick={() => setTableDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Tabela
              </Button>
            </div>
          ) : loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : ranges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma faixa salarial cadastrada nesta tabela
              </p>
              <Button onClick={() => setBulkImportOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Faixas em Massa
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getLabel('grade')}</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="text-right">1º Quartil</TableHead>
                    <TableHead className="text-right">Média de Mercado</TableHead>
                    <TableHead className="text-right">3º Quartil</TableHead>
                    <TableHead className="text-right">Máximo</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranges.map((range) => (
                    <TableRow key={range.id}>
                      <TableCell className="font-semibold">{range.grade}</TableCell>
                      <TableCell>
                        <Badge variant={range.calculation_mode === 'automatic' ? 'default' : 'outline'}>
                          {range.calculation_mode === 'automatic' ? (
                            <>
                              <Calculator className="w-3 h-3 mr-1" />
                              Automático
                            </>
                          ) : (
                            'Manual'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(range.min_value)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(range.q1_value)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(range.median_value)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(range.q3_value)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(range.max_value)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedGrade(range.grade); setDialogOpen(true); }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SalaryRangeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        grade={selectedGrade}
        salaryTableId={selectedTableId}
        onSuccess={fetchRanges}
      />

      <SalaryTableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        onSuccess={() => {
          // Atualizar seletor (forçar re-render)
          setSelectedTableId(null);
          setTimeout(() => fetchRanges(), 100);
        }}
      />

      <SalaryBulkImport
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        salaryTableId={selectedTableId || ''}
        onSuccess={fetchRanges}
      />
    </div>
  );
}
