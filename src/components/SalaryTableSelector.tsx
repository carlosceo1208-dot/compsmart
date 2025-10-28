import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SalaryTable {
  id: string;
  name: string;
  effective_month: number;
  effective_year: number;
  is_active: boolean;
}

interface SalaryTableSelectorProps {
  value: string | null;
  onChange: (tableId: string) => void;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function SalaryTableSelector({ value, onChange }: SalaryTableSelectorProps) {
  const { toast } = useToast();
  const [tables, setTables] = useState<SalaryTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('salary_tables')
        .select('*')
        .order('is_active', { ascending: false })
        .order('effective_year', { ascending: false })
        .order('effective_month', { ascending: false });

      if (error) throw error;

      setTables(data || []);

      // Se não houver seleção e existir uma tabela ativa, selecionar automaticamente
      if (!value && data) {
        const activeTable = data.find(t => t.is_active);
        if (activeTable) {
          onChange(activeTable.id);
        } else if (data.length > 0) {
          onChange(data[0].id);
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
        <SelectTrigger className="w-[350px]">
          <SelectValue placeholder="Selecione uma tabela salarial" />
        </SelectTrigger>
        <SelectContent>
          {tables.map((table) => (
            <SelectItem key={table.id} value={table.id}>
              <div className="flex items-center gap-2">
                <span>{table.name}</span>
                <span className="text-muted-foreground text-xs">
                  ({formatVigencia(table.effective_month, table.effective_year)})
                </span>
                {table.is_active && (
                  <Badge variant="default" className="ml-2 text-xs">
                    Ativa
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
