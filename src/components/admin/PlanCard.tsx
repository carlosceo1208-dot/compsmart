import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Eye, EyeOff, Power, PowerOff, Check } from 'lucide-react';

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

type PlanCardProps = {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (planId: string) => void;
  onToggleActive: (planId: string, currentStatus: boolean) => void;
  onTogglePublic: (planId: string, currentStatus: boolean) => void;
};

export function PlanCard({ plan, onEdit, onDelete, onToggleActive, onTogglePublic }: PlanCardProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const discount = Math.round(((plan.monthly_price * 12 - plan.annual_price) / (plan.monthly_price * 12)) * 100);

  return (
    <Card className={!plan.is_active ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                {plan.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge variant={plan.is_public ? 'outline' : 'secondary'}>
                {plan.is_public ? 'Público' : 'Privado'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {plan.plan_type}
              </Badge>
            </div>
          </div>
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
        </div>
        {plan.description && (
          <CardDescription className="text-sm mt-2">
            {plan.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatPrice(plan.monthly_price)}</span>
            <span className="text-muted-foreground">/mês</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatPrice(plan.annual_price)}/ano
            <Badge variant="secondary" className="ml-2 text-xs">
              {discount}% de desconto
            </Badge>
          </div>
          {plan.setup_fee && plan.setup_fee > 0 && (
            <p className="text-xs text-muted-foreground">
              + Taxa de setup: {formatPrice(plan.setup_fee)}
            </p>
          )}
        </div>

        {/* Limits */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Funcionários:</span>
            <span className="font-medium">
              {plan.max_employees ? plan.max_employees : 'Ilimitado'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usuários:</span>
            <span className="font-medium">
              {plan.max_users ? plan.max_users : 'Ilimitado'}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Features:</p>
          <ul className="space-y-1">
            {plan.features.slice(0, 5).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
            {plan.features.length > 5 && (
              <li className="text-xs text-muted-foreground pl-6">
                + {plan.features.length - 5} features
              </li>
            )}
          </ul>
        </div>

        {/* Order */}
        <div className="pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Ordem de exibição: {plan.sort_order}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
