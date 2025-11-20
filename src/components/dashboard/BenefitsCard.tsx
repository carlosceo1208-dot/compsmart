import { useState } from 'react';
import { Gift, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useBenefitsKPI } from '@/hooks/useBenefitsKPI';
import { formatCompactCurrency, formatNumber, formatCurrency } from '@/lib/formatters';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Currency } from '@/types/economic';
import { BenefitDialog } from '@/components/benefits/BenefitDialog';
import { toast } from 'sonner';

interface BenefitsCardProps {
  currency: Currency;
}

const getBenefitTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    health: '🏥',
    dental: '🦷',
    life_insurance: '🛡️',
    meal_voucher: '🍽️',
    food_voucher: '🛒',
    transportation: '🚗',
    education: '📚',
    gym: '💪',
    other: '🎁',
  };
  return icons[type] || '🎁';
};

const getBenefitTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    health: 'Saúde',
    dental: 'Odonto',
    life_insurance: 'Seguro',
    meal_voucher: 'VR',
    food_voucher: 'VA',
    transportation: 'VT',
    education: 'Educação',
    gym: 'Academia',
    other: 'Outro',
  };
  return labels[type] || type;
};

export const BenefitsCard = ({ currency }: BenefitsCardProps) => {
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const queryClient = useQueryClient();
  const { data, isLoading } = useBenefitsKPI();
  const { convert } = useCurrencyConverter();

  const monthlyCost = data ? convert(data.monthlyCost, 'BRL', currency) : 0;

  const { data: benefitsList, isLoading: isLoadingList } = useQuery({
    queryKey: ['benefits-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('benefits')
        .select('id, name, description, benefit_type, value_per_employee, default_employee_contribution_type, default_employee_contribution_value, is_active')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: showBenefitsDialog,
  });

  const handleDelete = async (benefitId: string, benefitName: string) => {
    setIsDeleting(true);
    try {
      const { count } = await supabase
        .from('employee_benefits')
        .select('*', { count: 'exact', head: true })
        .eq('benefit_id', benefitId)
        .eq('is_active', true);

      if (count && count > 0) {
        toast.error(
          `Não é possível excluir "${benefitName}". Existem ${count} funcionário(s) com este benefício ativo. Desative as atribuições primeiro.`,
          { duration: 5000 }
        );
        setBenefitToDelete(null);
        return;
      }

      const { error } = await supabase
        .from('benefits')
        .delete()
        .eq('id', benefitId);

      if (error) throw error;

      toast.success(`Benefício "${benefitName}" excluído com sucesso`);
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      queryClient.invalidateQueries({ queryKey: ['benefits-list'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-benefits'] });
      setBenefitToDelete(null);
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast.error('Erro ao excluir benefício');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Gestão de Benefícios
            </CardTitle>
            <Link to="/benefits">
              <Button size="sm" variant="ghost" className="h-7 gap-1">
                <ExternalLink className="h-3 w-3" />
                <span className="text-xs">Gerenciar</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <button
                  onClick={() => setShowBenefitsDialog(true)}
                  className="text-3xl font-bold hover:underline cursor-pointer transition-colors"
                >
                  {formatNumber(data?.totalBenefits)}
                </button>
                <span className="text-sm text-muted-foreground">benefícios</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Custo Mensal: <span className="font-semibold text-foreground">{formatCompactCurrency(monthlyCost)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBenefitsDialog} onOpenChange={setShowBenefitsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Benefícios Cadastrados ({benefitsList?.length || 0})
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoadingList ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : benefitsList?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum benefício cadastrado ainda</p>
                <BenefitDialog 
                  trigger={
                    <Button className="mt-4">
                      Cadastrar Primeiro Benefício
                    </Button>
                  }
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benefício</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benefitsList?.map((benefit) => {
                    const employeeValue = benefit.default_employee_contribution_type === 'percentage'
                      ? (benefit.value_per_employee * (benefit.default_employee_contribution_value || 0)) / 100
                      : benefit.default_employee_contribution_value || 0;
                    
                    const companyValue = benefit.value_per_employee - employeeValue;
                    
                    return (
                      <TableRow key={benefit.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{benefit.name}</div>
                            {benefit.default_employee_contribution_type !== 'none' && employeeValue > 0 ? (
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <div>• Empresa: {formatCurrency(companyValue)} ({((companyValue/benefit.value_per_employee)*100).toFixed(0)}%)</div>
                                <div>• Funcionário: {formatCurrency(employeeValue)} 
                                  {benefit.default_employee_contribution_type === 'percentage' 
                                    ? ` (${benefit.default_employee_contribution_value}%)`
                                    : ' (fixo)'
                                  }
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">• 100% Empresa</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <span>{getBenefitTypeIcon(benefit.benefit_type)}</span>
                            <span>{getBenefitTypeLabel(benefit.benefit_type)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(benefit.value_per_employee)}
                        </TableCell>
                        <TableCell className="text-center">
                          {benefit.is_active ? (
                            <Badge variant="default" className="text-xs">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <BenefitDialog
                              benefit={benefit}
                              trigger={
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setBenefitToDelete({ id: benefit.id, name: benefit.name })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Link to="/benefits">
              <Button onClick={() => setShowBenefitsDialog(false)}>
                Gerenciar Todos <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!benefitToDelete} onOpenChange={(open) => !open && setBenefitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Tem certeza que deseja excluir o benefício <strong>"{benefitToDelete?.name}"</strong>?</p>
              <p className="text-destructive font-medium">Esta ação não pode ser desfeita.</p>
              <p className="text-xs">Se houver funcionários com este benefício atribuído, você precisará desativar essas atribuições antes de excluir.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (benefitToDelete) {
                  handleDelete(benefitToDelete.id, benefitToDelete.name);
                }
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
