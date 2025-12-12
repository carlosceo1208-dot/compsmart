import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSalaryTableStatus } from '@/hooks/useSalaryTableStatus';

export const SalaryTableSetupAlert = () => {
  const navigate = useNavigate();
  const { hasActiveTable, employeeCount, isLoading } = useSalaryTableStatus();

  // Don't show if loading, has active table, or no employees
  if (isLoading || hasActiveTable || employeeCount === 0) {
    return null;
  }

  return (
    <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <Lightbulb className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Configure sua Tabela Salarial
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-amber-700 dark:text-amber-300 text-sm">
          Você tem <strong>{employeeCount} funcionário{employeeCount > 1 ? 's' : ''}</strong> cadastrado{employeeCount > 1 ? 's' : ''}, 
          mas ainda não configurou uma tabela salarial ativa. 
          Para visualizar análises de People Analytics e posicionamento na faixa salarial, 
          crie e ative uma tabela salarial.
        </p>
        <Button 
          variant="outline" 
          size="sm"
          className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-300 dark:hover:bg-amber-900/30"
          onClick={() => navigate('/salary-ranges')}
        >
          Configurar Tabela Salarial
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
