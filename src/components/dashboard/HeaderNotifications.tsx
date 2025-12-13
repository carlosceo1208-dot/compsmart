import { Bell, FileCheck, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useHeaderNotifications } from '@/hooks/useHeaderNotifications';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const HeaderNotifications = () => {
  const navigate = useNavigate();
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();
  const { pendingApprovals, activeAlerts, pendingAdjustments, total, isLoading } = useHeaderNotifications();

  // Only show for Admin and HR Manager
  if (roleLoading || (!roleData?.isAdmin && !roleData?.isHR)) {
    return null;
  }

  const hasNotifications = total > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-full",
            hasNotifications && "animate-pulse"
          )}
        >
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground border-0"
            >
              {total > 9 ? '9+' : total}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notificações
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : !hasNotifications ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação pendente
          </div>
        ) : (
          <>
            {pendingApprovals > 0 && (
              <DropdownMenuItem 
                className="flex items-center gap-3 cursor-pointer p-3"
                onClick={() => navigate('/budget-approvals')}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Aprovações Pendentes</p>
                  <p className="text-xs text-muted-foreground">
                    {pendingApprovals} {pendingApprovals === 1 ? 'orçamento aguardando' : 'orçamentos aguardando'}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  {pendingApprovals}
                </Badge>
              </DropdownMenuItem>
            )}

            {activeAlerts > 0 && (
              <DropdownMenuItem 
                className="flex items-center gap-3 cursor-pointer p-3"
                onClick={() => navigate('/alert-settings')}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Alertas Ativos</p>
                  <p className="text-xs text-muted-foreground">
                    {activeAlerts} {activeAlerts === 1 ? 'alerta requer atenção' : 'alertas requerem atenção'}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                  {activeAlerts}
                </Badge>
              </DropdownMenuItem>
            )}

            {pendingAdjustments > 0 && (
              <DropdownMenuItem 
                className="flex items-center gap-3 cursor-pointer p-3"
                onClick={() => navigate('/salary-ranges')}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Dissídios Pendentes</p>
                  <p className="text-xs text-muted-foreground">
                    {pendingAdjustments} {pendingAdjustments === 1 ? 'ajuste a efetivar' : 'ajustes a efetivar'}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {pendingAdjustments}
                </Badge>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
