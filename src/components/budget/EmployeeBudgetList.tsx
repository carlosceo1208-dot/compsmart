import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { Edit, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  full_name: string;
  job_title?: string;
  salary?: number;
  changeCount?: number;
}

interface EmployeeBudgetListProps {
  employees: Employee[];
  onEditEmployee: (employeeId: string) => void;
  onAddPlannedHire: () => void;
}

export const EmployeeBudgetList = ({
  employees,
  onEditEmployee,
  onAddPlannedHire,
}: EmployeeBudgetListProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>👥 Funcionários da Unidade ({employees.length})</CardTitle>
        <Button onClick={onAddPlannedHire} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova Contratação Planejada
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="text-right">Salário Atual</TableHead>
              <TableHead className="text-center">Mudanças</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">
                  {employee.full_name}
                </TableCell>
                <TableCell>{employee.job_title || '-'}</TableCell>
                <TableCell className="text-right">
                  {employee.salary ? formatCurrency(employee.salary) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {employee.changeCount ? (
                    <Badge variant="secondary">
                      {employee.changeCount} {employee.changeCount === 1 ? 'mudança' : 'mudanças'}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditEmployee(employee.id)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum funcionário encontrado nesta unidade
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
