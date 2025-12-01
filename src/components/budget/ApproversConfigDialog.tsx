import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCog, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ApproversConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ApproversConfigDialog = ({ open, onOpenChange }: ApproversConfigDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userConfigs, setUserConfigs] = useState<Record<string, { superiorId: string | null; canSelfApprove: boolean }>>({});

  // Buscar usuários com roles de admin/hr_manager/manager
  const { data: usersWithRoles, isLoading: usersLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'hr_manager', 'manager']);
      
      if (rolesError) throw rolesError;
      
      const userIds = [...new Set(roles?.map(r => r.user_id) || [])];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, job_title')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      return profiles?.map(profile => {
        const userRoles = roles?.filter(r => r.user_id === profile.id).map(r => r.role) || [];
        return {
          ...profile,
          roles: userRoles,
        };
      });
    },
    enabled: open,
  });

  // Buscar configurações de aprovadores existentes
  const { data: approvers, isLoading: approversLoading } = useQuery({
    queryKey: ['budget-approvers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_approvers')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Mutation para salvar/atualizar configuração
  const saveMutation = useMutation({
    mutationFn: async ({
      userId,
      superiorId,
      canSelfApprove,
    }: {
      userId: string;
      superiorId: string | null;
      canSelfApprove: boolean;
    }) => {
      const { error } = await supabase
        .from('budget_approvers')
        .upsert({
          user_id: userId,
          superior_approver_id: superiorId,
          can_self_approve: canSelfApprove,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-approvers'] });
      toast.success('Configuração de aprovador salva com sucesso!');
      setSelectedUserId('');
    },
    onError: (error) => {
      toast.error('Erro ao salvar configuração');
      console.error(error);
    },
  });

  const handleSave = (userId: string, superiorId: string | null, canSelfApprove: boolean) => {
    saveMutation.mutate({ userId, superiorId, canSelfApprove });
  };

  const getUserApproverConfig = (userId: string) => {
    return approvers?.find(a => a.user_id === userId);
  };

  const getSuperiorName = (superiorId: string | null) => {
    if (!superiorId) return null;
    return usersWithRoles?.find(u => u.id === superiorId)?.full_name;
  };

  // Inicializar configurações quando dados carregarem
  useEffect(() => {
    if (approvers && usersWithRoles && Object.keys(userConfigs).length === 0) {
      const initialConfigs: Record<string, { superiorId: string | null; canSelfApprove: boolean }> = {};
      usersWithRoles.forEach(user => {
        const config = approvers.find(a => a.user_id === user.id);
        initialConfigs[user.id] = {
          superiorId: config?.superior_approver_id || null,
          canSelfApprove: config?.can_self_approve || false,
        };
      });
      setUserConfigs(initialConfigs);
    }
  }, [approvers, usersWithRoles, userConfigs]);

  // Atualizar configuração de um usuário específico
  const updateUserConfig = (userId: string, updates: Partial<{ superiorId: string | null; canSelfApprove: boolean }>) => {
    setUserConfigs(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || { superiorId: null, canSelfApprove: false }), ...updates }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Configuração de Aprovadores Superiores
          </DialogTitle>
          <DialogDescription>
            Configure quem pode aprovar orçamentos de cada gestor/administrador e defina permissões de auto-aprovação.
          </DialogDescription>
        </DialogHeader>

        <Alert className="mb-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Hierarquia de Aprovação:</strong> Se um usuário possui um aprovador superior configurado,
            ele não poderá aprovar seus próprios orçamentos. A submissão será encaminhada automaticamente ao superior.
          </AlertDescription>
        </Alert>

        {usersLoading || approversLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {usersWithRoles?.map((user) => {
              const config = getUserApproverConfig(user.id);
              const userConfig = userConfigs[user.id] || { superiorId: null, canSelfApprove: false };
              const { superiorId, canSelfApprove } = userConfig;
              const superiorName = getSuperiorName(superiorId);
              const hasChanges = superiorId !== (config?.superior_approver_id || null) || 
                                 canSelfApprove !== (config?.can_self_approve || false);

              return (
                <Card key={user.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div>
                        <span>{user.full_name}</span>
                        <div className="text-sm font-normal text-muted-foreground mt-1">
                          {user.job_title || 'Sem cargo definido'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.roles.map(role => (
                          <span
                            key={role}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            {role === 'admin' ? 'Admin' : role === 'hr_manager' ? 'HR' : 'Gestor'}
                          </span>
                        ))}
                      </div>
                    </CardTitle>
                    {superiorName && (
                      <CardDescription>
                        Superior atual: <strong>{superiorName}</strong>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Aprovador Superior</Label>
                        <Select
                          value={superiorId || 'none'}
                          onValueChange={(value) => updateUserConfig(user.id, { superiorId: value === 'none' ? null : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o aprovador superior" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">🚫 Sem superior (auto-aprovação permitida)</SelectItem>
                            {usersWithRoles
                              ?.filter(u => u.id !== user.id && u.roles.some(r => ['admin', 'hr_manager'].includes(r)))
                              .map(u => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.full_name} - {u.job_title || 'Sem cargo'}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Permitir Auto-Aprovação</Label>
                        <div className="flex items-center gap-2 h-10">
                          <Switch
                            checked={canSelfApprove}
                            onCheckedChange={(checked) => updateUserConfig(user.id, { canSelfApprove: checked })}
                            disabled={!!superiorId}
                          />
                          <span className="text-sm text-muted-foreground">
                            {superiorId 
                              ? '⚠️ Bloqueado (tem superior)'
                              : canSelfApprove 
                                ? '✅ Permitida (com justificativa)'
                                : '❌ Bloqueada'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {superiorId && (
                      <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/10">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-sm">
                          Com aprovador superior configurado, <strong>{user.full_name}</strong> não poderá
                          aprovar seus próprios orçamentos. Submissões serão encaminhadas para aprovação superior.
                        </AlertDescription>
                      </Alert>
                    )}

                    {hasChanges && (
                      <Button
                        onClick={() => handleSave(user.id, superiorId, canSelfApprove)}
                        disabled={saveMutation.isPending}
                        className="w-full"
                      >
                        {saveMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};