import { useNavigate } from 'react-router-dom';
import { ModuleCard } from '@/components/ModuleCard';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Briefcase,
  TrendingUp,
  BarChart3,
  DollarSign,
  Shield,
  Building,
  ArrowLeftRight,
  Settings,
  ShieldCheck,
  UserCircle,
  Scale,
  FileBarChart,
  FileCheck,
  Target,
  BookOpen,
  Bell,
  Building2,
  Bot,
  Gift,
} from 'lucide-react';

export const ModuleGrid = () => {
  const navigate = useNavigate();

  const activeModules = [
    {
      title: 'Minha Empresa',
      description: 'Dados, logo e configurações da empresa',
      icon: Building2,
      path: '/organization?tab=overview',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Comparação Salarial',
      description: 'Compare tabelas vs mercado',
      icon: ArrowLeftRight,
      path: '/salary-comparison',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Controle de Acesso',
      description: 'Gerencie permissões de usuários',
      icon: ShieldCheck,
      path: '/access-control',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Gestão Organizacional',
      description: 'Gerencie filiais, áreas e departamentos',
      icon: Building,
      path: '/organization',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Funcionários',
      description: 'Gerencie informações de funcionários',
      icon: Users,
      path: '/employees',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Gestão de Benefícios',
      description: 'Configure benefícios, elegibilidade e atribuições',
      icon: Gift,
      path: '/benefits',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Gestão de Perfis',
      description: 'Configure perfis de acesso',
      icon: Shield,
      path: '/roles',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Meu Perfil',
      description: 'Gerencie suas informações',
      icon: UserCircle,
      path: '/my-profile',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'People Analytics',
      description: 'KPIs de remuneração',
      icon: BarChart3,
      path: '/people-analytics',
      status: 'active' as const,
      category: 'consultation' as const,
    },
    {
      title: 'Pesquisa Salarial',
      description: 'Compare dados de mercado',
      icon: TrendingUp,
      path: '/survey-data',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Plano de Cargos',
      description: 'Configure estrutura de cargos',
      icon: Briefcase,
      path: '/job-titles',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Tabela Salarial',
      description: 'Gerencie tabelas salariais',
      icon: DollarSign,
      path: '/salary-ranges',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Assistente Jurídico',
      description: 'Consultoria trabalhista e previdenciária com IA',
      icon: Scale,
      path: '/legal-assistant',
      status: 'active' as const,
      category: 'consultation' as const,
    },
    {
      title: 'Programas de Incentivos',
      description: 'Gerencie ICP, ILP, PLR e Stock Options',
      icon: Target,
      path: '/incentive-programs',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Agente de Análise Salarial',
      description: 'IA para estruturas, faixas e benchmarking salarial',
      icon: TrendingUp,
      path: '/salary-assistant',
      status: 'active' as const,
      category: 'consultation' as const,
    },
    {
      title: 'Assistente de R&B',
      description: 'Consultas sobre Remuneração e Benefícios com IA',
      icon: Bot,
      path: '/incentive-assistant',
      status: 'active' as const,
      category: 'consultation' as const,
    },
    {
      title: 'Análise Salarial',
      description: 'Relatório de posicionamento salarial',
      icon: FileBarChart,
      path: '/salary-analysis-report',
      status: 'active' as const,
      category: 'consultation' as const,
    },
    {
      title: 'Aprovações de Orçamento',
      description: 'Revise e aprove orçamentos',
      icon: FileCheck,
      path: '/budget-approvals',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Base de Conhecimento',
      description: 'Gerencie documentos de referência para os Agentes Smart',
      icon: BookOpen,
      path: '/knowledge-base',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Auditoria de Acesso',
      description: 'Logs e relatórios de uso dos Agentes Smart',
      icon: Shield,
      path: '/audit-logs',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Alertas Automáticos',
      description: 'Configure alertas de monitoramento dos agentes',
      icon: Bell,
      path: '/alert-settings',
      status: 'active' as const,
      category: 'management' as const,
    },
    {
      title: 'Configurações',
      description: 'Parametrize o sistema',
      icon: Settings,
      path: '/settings',
      status: 'beta' as const,
      category: 'management' as const,
    },
  ];

  // Separar módulos por tipo
  const smartAgents = activeModules.filter(m => 
    m.path.includes('assistant') || m.path === '/salary-assistant'
  );

  const analyticsModules = activeModules.filter(m => 
    m.category === 'consultation' && !smartAgents.some(agent => agent.path === m.path)
  );

  const managementModules = activeModules.filter(m => 
    m.category === 'management'
  );

  return (
    <div className="space-y-8">
      {/* Seção 1: Agentes Smart (Destaque Premium) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Agentes Smart
          </h3>
          <Badge className="ml-2 bg-gradient-to-r from-primary to-purple-600 border-0">
            IA
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {smartAgents.map((module) => (
            <ModuleCard
              key={module.path}
              title={module.title}
              description={module.description}
              icon={module.icon}
              status={module.status}
              category={module.category}
              requiredPlan={'requiredPlan' in module ? module.requiredPlan as any : undefined}
              onClick={() => navigate(module.path)}
              isSmartAgent={true}
            />
          ))}
        </div>
      </div>

      {/* Seção 2: Analytics & Relatórios */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Analytics & Relatórios</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {analyticsModules.map((module) => (
            <ModuleCard
              key={module.path}
              title={module.title}
              description={module.description}
              icon={module.icon}
              status={module.status}
              category={module.category}
              requiredPlan={'requiredPlan' in module ? module.requiredPlan as any : undefined}
              onClick={() => navigate(module.path)}
            />
          ))}
        </div>
      </div>

      {/* Seção 3: Gestão e Configuração */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Gestão e Configuração</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {managementModules.map((module) => (
            <ModuleCard
              key={module.path}
              title={module.title}
              description={module.description}
              icon={module.icon}
              status={module.status}
              category={module.category}
              requiredPlan={'requiredPlan' in module ? module.requiredPlan as any : undefined}
              onClick={() => navigate(module.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
