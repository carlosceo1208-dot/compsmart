import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { type SalaryModality, getModalityConfig } from '@/lib/salaryModality';

interface SalaryTable {
  id: string;
  name: string;
  effective_month: number;
  effective_year: number;
  is_active: boolean;
  modality: SalaryModality;
}

interface SalaryTableSelectorProps {
  value: string | null;
  onChange: (tableId: string) => void;
  filterModality?: SalaryModality;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function SalaryTableSelector({ value, onChange, filterModality }: SalaryTableSelectorProps) {
  const { toast } = useToast();
  const [tables, setTables] = useState<SalaryTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, [filterModality]);

  const fetchTables = async () => {
    try {
      let query = supabase
        .from('salary_tables')
        .select('*')
        .order('is_active', { ascending: false })
        .order('effective_year', { ascending: false })
        .order('effective_month', { ascending: false });

      if (filterModality) {
        query = query.eq('modality', filterModality);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map modality with fallback
      const mappedData = (data || []).map(t => ({
        ...t,
        modality: (t.modality as SalaryModality) || 'fixed_salary'
      }));

      setTables(mappedData);

      // Se não houver seleção e existir uma tabela ativa, selecionar automaticamente
      if (!value && mappedData.length > 0) {
        const activeTable = mappedData.find(t => t.is_active);
        if (activeTable) {
          onChange(activeTable.id);
        } else {
          onChange(mappedData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching salary tables:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tabelas salariais',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatVigencia = (month: number, year: number) => {
    return `${MONTHS_SHORT[month - 1]}/${year}`;
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando tabelas...</div>;
  }

  if (tables.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhuma tabela salarial cadastrada
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="w-[400px]">
          <SelectValue placeholder="Selecione uma tabela salarial" />
        </SelectTrigger>
        <SelectContent>
          {tables.map((table) => {
            const modalityConfig = getModalityConfig(table.modality);
            return (
              <SelectItem key={table.id} value={table.id}>
                <div className="flex items-center gap-2">
                  <span>{table.name}</span>
                  <span className="text-muted-foreground text-xs">
                    ({formatVigencia(table.effective_month, table.effective_year)})
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${modalityConfig.color} ${modalityConfig.borderColor}`}
                  >
                    {modalityConfig.shortLabel}
                  </Badge>
                  {table.is_active && (
                    <Badge variant="default" className="text-xs">
                      Ativa
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
