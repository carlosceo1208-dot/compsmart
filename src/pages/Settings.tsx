import { useState, useEffect } from 'react';
import { useLabels } from '@/contexts/LabelsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings as SettingsIcon, FileEdit, CreditCard, Crown, ChevronRight, TestTube, QrCode, Landmark, Wallet, AlertCircle, PlayCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { resetDashboardTour } from '@/components/dashboard/DashboardTour';

export default function Settings() {
  const { labels, updateLabel } = useLabels();
  const [localLabels, setLocalLabels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLocalLabels(labels);
  }, [labels]);

  const handleRestartTour = () => {
    resetDashboardTour();
    toast.success('Tour reiniciado! Redirecionando...');
    navigate('/dashboard');
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const newValue = localLabels[key];
      const defaultValue = labels[key];
      
      // Se o valor é igual ao padrão, salvar como null (usa o padrão)
      await updateLabel(key, newValue === defaultValue ? null : newValue);
      toast.success('Label atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar label');
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (key: string, defaultLabel: string) => {
    setSaving(key);
    try {
      setLocalLabels({ ...localLabels, [key]: defaultLabel });
      await updateLabel(key, null);
      toast.success('Label restaurado para o padrão');
    } catch (error) {
      toast.error('Erro ao restaurar label');
    } finally {
      setSaving(null);
    }
  };

  const labelConfigs = [
    {
      key: 'grade',
      defaultLabel: 'Grade',
      title: 'Nomenclatura para Níveis Hierárquicos',
      description: 'Usado em: Cadastro de Cargos, Perfil de Funcionários, Filtros, Tabela Salarial',
      placeholder: 'Ex: Grade, Nível, Faixa, etc.'
    },
    {
      key: 'salary',
      defaultLabel: 'Salário',
      title: 'Nomenclatura para Remuneração',
      description: 'Usado em: Perfil de Funcionários, Relatórios',
      placeholder: 'Ex: Salário, Remuneração, Vencimento, etc.'
    },
    {
      key: 'unit',
      defaultLabel: 'Unidade',
      title: 'Nomenclatura para Unidades Organizacionais',
      description: 'Usado em: Estrutura Organizacional, Perfil de Funcionários',
      placeholder: 'Ex: Unidade, Lotação, Centro de Custo, etc.'
    },
    {
      key: 'job_title',
      defaultLabel: 'Cargo',
      title: 'Nomenclatura para Cargos',
      description: 'Usado em: Cadastro de Cargos, Perfil de Funcionários',
      placeholder: 'Ex: Cargo, Função, Posição, etc.'
    },
    {
      key: 'employee',
      defaultLabel: 'Funcionário',
      title: 'Nomenclatura para Colaboradores',
      description: 'Usado em: Gestão de Pessoas, Relatórios',
      placeholder: 'Ex: Funcionário, Colaborador, Servidor, etc.'
    },
    {
      key: 'manager',
      defaultLabel: 'Gestor',
      title: 'Nomenclatura para Gestores',
      description: 'Usado em: Perfil de Funcionários, Hierarquia',
      placeholder: 'Ex: Gestor, Supervisor, Gerente, etc.'
    },
    {
      key: 'salary_range',
      defaultLabel: 'Faixa Salarial',
      title: 'Nomenclatura para Faixas de Remuneração',
      description: 'Usado em: Tabela Salarial, Análise de Cargos',
      placeholder: 'Ex: Faixa Salarial, Tabela Salarial, etc.'
    }
  ];

  const { data: userRole } = useCurrentUserRole();
  const isAdmin = userRole?.isAdmin || false;
  const isSuperAdmin = userRole?.isSuperAdmin || false;

  // Plano de teste R$ 1,00 (PIX, Crédito, Débito)
  const TEST_PLAN_ID = 'e486df57-48cf-4ac1-968e-fd26aff0df83';
  // Plano de teste R$ 5,00 (Boleto - valor mínimo exigido por bancos)
  const BOLETO_TEST_PLAN_ID = 'cdd92cbb-d800-4306-b88a-e47ef43fe3a5';

  const paymentTestButtons = [
    {
      method: 'pix',
      label: 'Testar PIX',
      description: 'QR Code + 5% desconto',
      icon: QrCode,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      planId: TEST_PLAN_ID,
      amount: 'R$ 1,00',
    },
    {
      method: 'credit_card',
      label: 'Testar Cartão Crédito',
      description: 'Tokenização frontend',
      icon: CreditCard,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
      planId: TEST_PLAN_ID,
      amount: 'R$ 1,00',
    },
    {
      method: 'debit_card',
      label: 'Testar Cartão Débito',
      description: 'Débito à vista',
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      planId: TEST_PLAN_ID,
      amount: 'R$ 1,00',
    },
    {
      method: 'boleto',
      label: 'Testar Boleto',
      description: 'Vencimento em 3 dias (mín R$5)',
      icon: Landmark,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      planId: BOLETO_TEST_PLAN_ID,
      amount: 'R$ 5,00',
    },
  ];

  const settingsLinks = [
    // Meu Plano - visível para todos os admins/hr (não super admin)
    { 
      title: 'Meu Plano', 
      description: 'Visualize e gerencie sua assinatura', 
      path: '/settings/my-plan', 
      icon: Crown,
      adminOnly: true,
      superAdminOnly: false,
      hideForSuperAdmin: true // Super Admin usa "Gerenciar Planos"
    },
    // Gerenciar Planos - apenas Super Admin
    { 
      title: 'Gerenciar Planos', 
      description: 'Gerencie os planos da plataforma', 
      path: '/settings/plans', 
      icon: Crown,
      adminOnly: false,
      superAdminOnly: true 
    },
    { 
      title: 'Faturamento', 
      description: 'Visualize faturas e métodos de pagamento', 
      path: '/settings/billing', 
      icon: CreditCard,
      adminOnly: false,
      superAdminOnly: false
    },
    // Landing Page - apenas Super Admin
    { 
      title: 'Conteúdo da Landing Page', 
      description: 'Edite os textos da página inicial', 
      path: '/settings/landing-content', 
      icon: FileEdit,
      adminOnly: false,
      superAdminOnly: true 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Personalize a nomenclatura e gerencie configurações
          </p>
        </div>
      </div>

      {/* Quick Links Section */}
      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
          <CardDescription>
            Navegue para outras áreas de configuração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {settingsLinks
              .filter(link => {
                // Super Admin only links
                if (link.superAdminOnly) return isSuperAdmin;
                // Hide from Super Admin (ex: Meu Plano)
                if (link.hideForSuperAdmin && isSuperAdmin) return false;
                // Admin only links
                if (link.adminOnly) return isAdmin;
                return true;
              })
              .map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <link.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{link.title}</p>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            
            {/* Botão Reiniciar Tour */}
            <button
              onClick={handleRestartTour}
              className="flex items-center gap-3 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-left"
            >
              <PlayCircle className="h-5 w-5 text-emerald-600" />
              <div className="flex-1">
                <p className="font-medium text-sm text-emerald-800 dark:text-emerald-200">Reiniciar Tour</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Ver instruções novamente</p>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-500" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Testing Area - Super Admin Only */}
      {isSuperAdmin && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-800 dark:text-amber-200">
                Área de Testes de Pagamento
              </CardTitle>
            </div>
            <CardDescription>
              Teste os métodos de pagamento com o plano de R$ 1,00. Visível apenas para Super Admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {paymentTestButtons.map((btn) => (
                <Link
                  key={btn.method}
                  to={`/checkout?plan=${btn.planId}&cycle=monthly&method=${btn.method}`}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${btn.bgColor} hover:scale-105 transition-all duration-200`}
                >
                  <btn.icon className={`h-8 w-8 ${btn.color}`} />
                  <p className="font-medium text-sm text-center">{btn.label}</p>
                  <p className="text-xs text-muted-foreground text-center">
                    {btn.description}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {btn.amount}
                  </Badge>
                </Link>
              ))}
            </div>
            
            <Alert className="mt-4 border-amber-300 dark:border-amber-700">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                Estes pagamentos são reais via Pagar.me. Sem assinatura recorrente configurada.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Labels Section */}
      <Card>
        <CardHeader>
          <CardTitle>Labels Personalizáveis</CardTitle>
          <CardDescription>
            Ajuste os termos usados no sistema para se adequar à nomenclatura da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {labelConfigs.map((config) => (
            <div key={config.key} className="space-y-2 pb-4 border-b last:border-b-0">
              <div>
                <Label className="text-base font-semibold">{config.title}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.description}
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={localLabels[config.key] || ''}
                  onChange={(e) => setLocalLabels({ ...localLabels, [config.key]: e.target.value })}
                  placeholder={config.placeholder}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleSave(config.key)}
                  disabled={saving === config.key || localLabels[config.key] === labels[config.key]}
                >
                  {saving === config.key ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleReset(config.key, config.defaultLabel)}
                  disabled={saving === config.key || localLabels[config.key] === config.defaultLabel}
                >
                  Restaurar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Padrão:</strong> {config.defaultLabel} | <strong>Atual:</strong> {labels[config.key] || config.defaultLabel}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
