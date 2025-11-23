import { useState, useEffect } from 'react';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, LayoutGrid, Table as TableIcon, TrendingUp } from 'lucide-react';
import { PlanDialog } from '@/components/admin/PlanDialog';
import { PlanCard } from '@/components/admin/PlanCard';
import { PlansTable } from '@/components/admin/PlansTable';
import { useNavigate } from 'react-router-dom';

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
  created_at: string;
  updated_at: string;
};

type FilterType = 'all' | 'active' | 'inactive' | 'public' | 'private';

export default function Plans() {
  const navigate = useNavigate();
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (!roleLoading && !roleData?.isAdmin && !roleData?.isHR) {
      toast.error('Acesso negado. Apenas administradores podem gerenciar planos.');
      navigate('/dashboard');
      return;
    }
    
    if (!roleLoading) {
      fetchPlans();
    }
  }, [roleLoading, roleData, navigate]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      // Cast features from Json to string[]
      const plansWithFeatures = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
      setPlans(plansWithFeatures);
    } catch (error: any) {
      toast.error('Erro ao carregar planos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Verificar se há empresas usando este plano
      const { count } = await supabase
        .from('organizational_structure')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_plan_id', planId);

      if (count && count > 0) {
        toast.error(`Não é possível excluir. ${count} empresa(s) estão usando este plano.`);
        return;
      }

      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast.success('Plano excluído com sucesso!');
      fetchPlans();
    } catch (error: any) {
      toast.error('Erro ao excluir plano: ' + error.message);
    }
  };

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      toast.success(`Plano ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      fetchPlans();
    } catch (error: any) {
      toast.error('Erro ao atualizar plano: ' + error.message);
    }
  };

  const handleTogglePublic = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_public: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      toast.success(`Plano agora é ${!currentStatus ? 'público' : 'privado'}!`);
      fetchPlans();
    } catch (error: any) {
      toast.error('Erro ao atualizar plano: ' + error.message);
    }
  };

  const filteredPlans = plans.filter(plan => {
    switch (filter) {
      case 'active':
        return plan.is_active;
      case 'inactive':
        return !plan.is_active;
      case 'public':
        return plan.is_public;
      case 'private':
        return !plan.is_public;
      default:
        return true;
    }
  });

  const stats = {
    total: plans.length,
    active: plans.filter(p => p.is_active).length,
    public: plans.filter(p => p.is_public).length,
    inactive: plans.filter(p => !p.is_active).length,
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Planos</h1>
          <p className="text-muted-foreground mt-1">
            Configure e gerencie os planos de assinatura disponíveis
          </p>
        </div>
        <Button onClick={handleCreatePlan}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Planos</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Planos Ativos</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Planos Públicos</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.public}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Planos Inativos</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.inactive}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos ({plans.length})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Ativos ({stats.active})
              </Button>
              <Button
                variant={filter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('inactive')}
              >
                Inativos ({stats.inactive})
              </Button>
              <Button
                variant={filter === 'public' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('public')}
              >
                Públicos ({stats.public})
              </Button>
              <Button
                variant={filter === 'private' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('private')}
              >
                Privados ({plans.length - stats.public})
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('table')}
              >
                <TableIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum plano encontrado com os filtros selecionados.
              </p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={handleEditPlan}
                  onDelete={handleDeletePlan}
                  onToggleActive={handleToggleActive}
                  onTogglePublic={handleTogglePublic}
                />
              ))}
            </div>
          ) : (
            <PlansTable
              plans={filteredPlans}
              onEdit={handleEditPlan}
              onDelete={handleDeletePlan}
              onToggleActive={handleToggleActive}
              onTogglePublic={handleTogglePublic}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editingPlan}
        onSuccess={() => {
          fetchPlans();
          setDialogOpen(false);
          setEditingPlan(null);
        }}
      />
    </div>
  );
}
