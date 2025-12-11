import React from 'react';
import { Building2, Check, ChevronDown, Home, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { cn } from '@/lib/utils';

const planColors: Record<string, string> = {
  starter: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-violet-500/20 text-violet-700 dark:text-violet-400',
  pro: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  enterprise: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
};

const getPlanColor = (planName: string | undefined) => {
  if (!planName) return 'bg-muted text-muted-foreground';
  const lowerPlan = planName.toLowerCase();
  return planColors[lowerPlan] || 'bg-muted text-muted-foreground';
};

export const CompanySwitcher: React.FC = () => {
  const roleQuery = useCurrentUserRole();
  const isSuperAdmin = roleQuery.data?.isSuperAdmin ?? false;
  const roleLoading = roleQuery.isLoading;
  
  const {
    activeCompany,
    companies,
    isLoading,
    setActiveCompany,
    clearActiveCompany,
    isViewingOtherCompany,
    ownCompanyId,
    activeCompanyId,
  } = useCompanyContext();

  if (!isSuperAdmin || isLoading || roleLoading) {
    return null;
  }

  const displayName = activeCompany?.fantasy_name || activeCompany?.name || 'Selecionar empresa';

  return (
    <div className="flex items-center gap-2">
      {isViewingOtherCompany && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearActiveCompany}
          className="h-8 gap-1.5 border-amber-500/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 gap-2 px-3",
              isViewingOtherCompany && "border-amber-500/50 bg-amber-500/10"
            )}
          >
            {activeCompany?.logo_url ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={activeCompany.logo_url} alt={displayName} />
                <AvatarFallback className="text-[10px]">
                  {displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="max-w-[120px] truncate text-sm font-medium">
              {displayName}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[280px] bg-popover z-50">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Trocar empresa
          </div>

          {companies
            .filter(c => c.id !== ownCompanyId)
            .map((company) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => setActiveCompany(company.id)}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {company.logo_url ? (
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={company.logo_url} alt={company.name} />
                      <AvatarFallback className="text-[10px]">
                        {(company.fantasy_name || company.name).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="truncate text-sm">
                    {company.fantasy_name || company.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", getPlanColor(company.planName))}>
                    {company.planName}
                  </Badge>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {company.employeeCount}
                  </span>
                  {activeCompanyId === company.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}

          {ownCompanyId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={clearActiveCompany}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Minha empresa</span>
                </div>
                {activeCompanyId === ownCompanyId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
