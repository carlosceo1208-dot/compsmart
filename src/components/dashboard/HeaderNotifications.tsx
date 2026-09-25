import { Bell, FileCheck, AlertTriangle, DollarSign, Award, Inbox } from 'lucide-react';
import { useNewLeadsCount } from '@/hooks/useNewLeadsCount';
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
  const { pendingApprovals, activeAlerts, pendingAdjustments, unreadKudos, total, isLoading } = useHeaderNotifications();
  const { isSuperAdmin, newLeads } = useNewLeadsCount();

  // Show for everyone if they have unread kudos, otherwise only Admin/HR
  const hasPersonalNotifications = unreadKudos > 0;
  const hasAdminNotifications = pendingApprovals > 0 || activeAlerts > 0 || pendingAdjustments > 0;
  const showAdminNotifications = !roleLoading && (roleData?.isAdmin || roleData?.isHR);
  const showLeads = isSuperAdmin && newLeads > 0;

  // If no notifications at all, don't show the bell for non-admins
  if (!hasPersonalNotifications && !showAdminNotifications && !showLeads) {
    return null;
  }

  const hasNotifications = total + (showLeads ? newLeads : 0) > 0;
  const badgeTotal = total + (showLeads ? newLeads : 0);

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
              {badgeTotal > 9 ? '9+' : badgeTotal}
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
            {/* Kudos - visible to everyone */}
            {unreadKudos > 0 && (
              <DropdownMenuItem 
                className="flex items-center gap-3 cursor-pointer p-3"
                onClick={() => navigate('/performance/kudos?tab=received')}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Reconhecimentos Recebidos</p>
                  <p className="text-xs text-muted-foreground">
                    {unreadKudos} {unreadKudos === 1 ? 'novo reconhecimento' : 'novos reconhecimentos'}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {unreadKudos}
                </Badge>
              </DropdownMenuItem>
            )}

            {/* Admin/HR only notifications */}
            {showAdminNotifications && (
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
