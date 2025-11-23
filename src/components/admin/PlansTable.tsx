import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Eye, EyeOff, Power, PowerOff } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  description: string | null;
  plan_type: string;
  monthly_price: number;
  annual_price: number;
  setup_fee: number | null;
  max_employees: number | null;
  max_users: number | null;
  features: string[];
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
};

type PlansTableProps = {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onDelete: (planId: string) => void;
  onToggleActive: (planId: string, currentStatus: boolean) => void;
  onTogglePublic: (planId: string, currentStatus: boolean) => void;
};

export function PlansTable({ plans, onEdit, onDelete, onToggleActive, onTogglePublic }: PlansTableProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ordem</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Visibilidade</TableHead>
            <TableHead className="text-right">Mensal</TableHead>
            <TableHead className="text-right">Anual</TableHead>
            <TableHead className="text-center">Limites</TableHead>
            <TableHead className="text-center">Features</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <TableCell className="font-medium">{plan.sort_order}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{plan.name}</p>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {plan.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {plan.plan_type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={plan.is_public ? 'outline' : 'secondary'}>
                  {plan.is_public ? 'Público' : 'Privado'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="text-sm">
                  <p className="font-medium">{formatPrice(plan.monthly_price)}</p>
                  {plan.setup_fee && plan.setup_fee > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +{formatPrice(plan.setup_fee)}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="text-sm">
                  <p className="font-medium">{formatPrice(plan.annual_price)}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(((plan.monthly_price * 12 - plan.annual_price) / (plan.monthly_price * 12)) * 100)}% off
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="text-xs space-y-0.5">
                  <p>👥 {plan.max_employees || '∞'}</p>
                  <p>👤 {plan.max_users || '∞'}</p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="text-xs">
                  {plan.features.length} features
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(plan)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActive(plan.id, plan.is_active)}>
                      {plan.is_active ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-2" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTogglePublic(plan.id, plan.is_public)}>
                      {plan.is_public ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Tornar Privado
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Tornar Público
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(plan.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
