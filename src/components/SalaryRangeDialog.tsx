import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { useLabels } from '@/contexts/LabelsContext';

interface SalaryRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade?: string | null;
  salaryTableId: string | null;
  onSuccess: () => void;
}

type CalculationMode = 'manual' | 'automatic';

interface SalaryValues {
  min: string;
  q1: string;
  median: string;
  q3: string;
  max: string;
}

export const SalaryRangeDialog = ({ open, onOpenChange, grade, salaryTableId, onSuccess }: SalaryRangeDialogProps) => {
  const { getLabel } = useLabels();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<CalculationMode>('manual');
  const [gradeInput, setGradeInput] = useState('');
  
  const [manualValues, setManualValues] = useState<SalaryValues>({
    min: '',
    q1: '',
    median: '',
    q3: '',
    max: '',
  });
  
  const [autoMedian, setAutoMedian] = useState('');
  const [calculatedValues, setCalculatedValues] = useState<SalaryValues | null>(null);

  useEffect(() => {
    if (open && grade) {
      fetchExistingRange();
    } else {
      resetForm();
    }
  }, [open, grade]);

  const fetchExistingRange = async () => {
    if (!grade || !salaryTableId) return;
    
    try {
      const { data, error } = await supabase
        .from('salary_ranges')
        .select('*')
        .eq('grade', grade)
        .eq('salary_table_id', salaryTableId)
        .single();

      if (error) throw error;

      if (data) {
        setGradeInput(data.grade);
        setMode(data.calculation_mode);
        setManualValues({
          min: data.min_value.toString(),
          q1: data.q1_value.toString(),
          median: data.median_value.toString(),
          q3: data.q3_value.toString(),
          max: data.max_value.toString(),
        });
        
        if (data.calculation_mode === 'automatic') {
          setAutoMedian(data.input_median?.toString() || '');
        }
      }
    } catch (error) {
      console.error('Error fetching salary range:', error);
    }
  };

  const resetForm = () => {
    setGradeInput('');
    setMode('manual');
    setManualValues({ min: '', q1: '', median: '', q3: '', max: '' });
    setAutoMedian('');
    setCalculatedValues(null);
  };

  const handleCalculateAuto = async () => {
    if (!autoMedian) {
      toast.error('Preencha o ponto médio');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('calculate_salary_range_fixed', {
        p_median: parseFloat(autoMedian),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        setCalculatedValues({
          min: result.min_value.toFixed(2),
          q1: result.q1_value.toFixed(2),
          median: result.median_value.toFixed(2),
          q3: result.q3_value.toFixed(2),
          max: result.max_value.toFixed(2),
        });
        toast.success('Faixa calculada com sucesso! (-20% / +25%)');
      }
    } catch (error) {
      console.error('Error calculating range:', error);
      toast.error('Erro ao calcular faixa salarial');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const values = mode === 'manual' ? manualValues : calculatedValues;
      
      if (!values) {
        toast.error('Valores não calculados. Clique em "Calcular Faixa"');
        setLoading(false);
        return;
      }

      const dataToSave = {
        salary_table_id: salaryTableId,
        grade: gradeInput || grade,
        calculation_mode: mode,
        min_value: parseFloat(values.min),
        q1_value: parseFloat(values.q1),
        median_value: parseFloat(values.median),
        q3_value: parseFloat(values.q3),
        max_value: parseFloat(values.max),
        input_median: mode === 'automatic' ? parseFloat(autoMedian) : null,
        input_amplitude: null,
      };

      const { error } = await supabase
        .from('salary_ranges')
        .upsert(dataToSave, { 
          onConflict: 'salary_table_id,grade',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast.success(`${getLabel('salary_range')} ${grade ? 'atualizada' : 'criada'} com sucesso!`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving salary range:', error);
      toast.error('Erro ao salvar faixa salarial');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {grade ? `Editar ${getLabel('salary_range')} - ${grade}` : `Nova ${getLabel('salary_range')}`}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <form id="salary-range-form" onSubmit={handleSubmit} className="space-y-6">
            {!grade && (
              <div>
                <Label>{getLabel('grade')}</Label>
                <Input
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Ex: Nível 5, Grade A, etc."
                  required
                />
              </div>
            )}

            <div>
              <Label>Modo de Definição</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as CalculationMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="cursor-pointer font-normal">
                    Manual - Informar os 5 valores individualmente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="automatic" id="automatic" />
                  <Label htmlFor="automatic" className="cursor-pointer font-normal">
                    Automático - Calcular baseado em Ponto Médio + Amplitude
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {mode === 'manual' && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <Label className="text-xs">Mínimo</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={manualValues.min}
                        onChange={(e) => setManualValues({ ...manualValues, min: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">1º Quartil</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={manualValues.q1}
                        onChange={(e) => setManualValues({ ...manualValues, q1: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Média de Mercado</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={manualValues.median}
                        onChange={(e) => setManualValues({ ...manualValues, median: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">3º Quartil</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={manualValues.q3}
                        onChange={(e) => setManualValues({ ...manualValues, q3: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Máximo</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={manualValues.max}
                        onChange={(e) => setManualValues({ ...manualValues, max: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {mode === 'automatic' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label>Média de Mercado (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={autoMedian}
                        onChange={(e) => setAutoMedian(e.target.value)}
                        placeholder="Ex: 7000"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        O sistema calculará automaticamente: Mínimo (-20%) e Máximo (+25%)
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCalculateAuto}
                      className="w-full"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Calcular Faixa Salarial
                    </Button>
                  </CardContent>
                </Card>

                {calculatedValues && (
                  <Card className="bg-primary/5">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-4">Valores Calculados</h4>
                      <div className="grid grid-cols-5 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
                          <p className="font-semibold text-sm">{formatCurrency(calculatedValues.min)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">1º Quartil</p>
                          <p className="font-semibold text-sm">{formatCurrency(calculatedValues.q1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Média de Mercado</p>
                          <p className="font-semibold text-sm text-primary">{formatCurrency(calculatedValues.median)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">3º Quartil</p>
                          <p className="font-semibold text-sm">{formatCurrency(calculatedValues.q3)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Máximo</p>
                          <p className="font-semibold text-sm">{formatCurrency(calculatedValues.max)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="salary-range-form" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Faixa Salarial'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
