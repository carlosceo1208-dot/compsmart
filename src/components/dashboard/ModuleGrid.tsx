import { useNavigate } from 'react-router-dom';
import { ModuleCard } from '@/components/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { PlanType } from '@/hooks/useFeatureAccess';
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
  LucideIcon,
} from 'lucide-react';

interface ModuleDefinition {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  status: 'active' | 'coming-soon' | 'beta';
  category: 'management' | 'consultation';
  requiredPlan?: PlanType;
}

export const ModuleGrid = () => {
  const navigate = useNavigate();

  const activeModules: ModuleDefinition[] = [
    {
      title: 'Minha Empresa',
      description: 'Dados, logo e configurações da empresa',
      icon: Building2,
      path: '/organization?tab=overview',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Comparação Salarial',
      description: 'Compare tabelas vs mercado',
      icon: ArrowLeftRight,
      path: '/salary-comparison',
      status: 'active',
      category: 'management',
      requiredPlan: 'medium',
    },
    {
      title: 'Controle de Acesso',
      description: 'Gerencie permissões de usuários',
      icon: ShieldCheck,
      path: '/access-control',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Gestão Organizacional',
      description: 'Gerencie filiais, áreas e departamentos',
      icon: Building,
      path: '/organization',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Funcionários',
      description: 'Gerencie informações de funcionários',
      icon: Users,
      path: '/employees',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Gestão de Benefícios',
      description: 'Configure benefícios, elegibilidade e atribuições',
      icon: Gift,
      path: '/benefits',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Gestão de Perfis',
      description: 'Configure perfis de acesso',
      icon: Shield,
      path: '/roles',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Meu Perfil',
      description: 'Gerencie suas informações',
      icon: UserCircle,
      path: '/my-profile',
      status: 'active',
      category: 'management',
    },
    {
      title: 'People Analytics',
      description: 'KPIs de remuneração',
      icon: BarChart3,
      path: '/people-analytics',
      status: 'active',
      category: 'consultation',
    },
    {
      title: 'Pesquisa Salarial',
      description: 'Compare dados de mercado',
      icon: TrendingUp,
      path: '/survey-data',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Plano de Cargos',
      description: 'Configure estrutura de cargos',
      icon: Briefcase,
      path: '/job-titles',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Tabela Salarial',
      description: 'Gerencie tabelas salariais',
      icon: DollarSign,
      path: '/salary-ranges',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Assistente Jurídico',
      description: 'Consultoria trabalhista e previdenciária com IA',
      icon: Scale,
      path: '/legal-assistant',
      status: 'active',
      category: 'consultation',
      requiredPlan: 'pro',
    },
    {
      title: 'Programas de Incentivos',
      description: 'Gerencie ICP, ILP, PLR e Stock Options',
      icon: Target,
      path: '/incentive-programs',
      status: 'active',
      category: 'management',
      requiredPlan: 'pro',
    },
    {
      title: 'Agente de Análise Salarial',
      description: 'IA para estruturas, faixas e benchmarking salarial',
      icon: TrendingUp,
      path: '/salary-assistant',
      status: 'active',
      category: 'consultation',
      requiredPlan: 'pro',
    },
    {
      title: 'Assistente de R&B',
      description: 'Consultas sobre Remuneração e Benefícios com IA',
      icon: Bot,
      path: '/incentive-assistant',
      status: 'active',
      category: 'consultation',
      requiredPlan: 'pro',
    },
    {
      title: 'Análise Salarial',
      description: 'Relatório de posicionamento salarial',
      icon: FileBarChart,
      path: '/salary-analysis-report',
      status: 'active',
      category: 'consultation',
      requiredPlan: 'pro',
    },
    {
      title: 'Aprovações de Orçamento',
      description: 'Revise e aprove orçamentos',
      icon: FileCheck,
      path: '/budget-approvals',
      status: 'active',
      category: 'management',
      requiredPlan: 'medium',
    },
    {
      title: 'Base de Conhecimento',
      description: 'Gerencie documentos de referência para os Agentes Smart',
      icon: BookOpen,
      path: '/knowledge-base',
      status: 'active',
      category: 'management',
      requiredPlan: 'medium',
    },
    {
      title: 'Auditoria de Acesso',
      description: 'Logs e relatórios de uso dos Agentes Smart',
      icon: Shield,
      path: '/audit-logs',
      status: 'active',
      category: 'management',
      requiredPlan: 'medium',
    },
    {
      title: 'Alertas Automáticos',
      description: 'Configure alertas de monitoramento dos agentes',
      icon: Bell,
      path: '/alert-settings',
      status: 'active',
      category: 'management',
      requiredPlan: 'medium',
    },
    {
      title: 'Configurações',
      description: 'Parametrize o sistema',
      icon: Settings,
      path: '/settings',
      status: 'beta',
      category: 'management',
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
    <div className="space-y-6">
      {/* Seção 1: Agentes Smart (Destaque Premium) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Agentes Smart
          </h3>
          <Badge className="ml-2 bg-gradient-to-r from-primary to-purple-600 border-0">
            IA
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {smartAgents.map((module) => (
            <ModuleCard
              key={module.path}
              title={module.title}
              description={module.description}
              icon={module.icon}
              status={module.status}
              category={module.category}
              requiredPlan={module.requiredPlan}
              onClick={() => navigate(module.path)}
              isSmartAgent={true}
            />
          ))}
        </div>
      </div>

      {/* Seção 2: Analytics & Relatórios */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Analytics & Relatórios</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {analyticsModules.map((module) => (
            <ModuleCard
              key={module.path}
              title={module.title}
              description={module.description}
              icon={module.icon}
              status={module.status}
              category={module.category}
              requiredPlan={module.requiredPlan}
              onClick={() => navigate(module.path)}
            />
          ))}
        </div>
      </div>

      {/* Seção 3: Gestão e Configuração */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Gestão e Configuração</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {managementModules.map((module) => (
            <ModuleCard
              key={module.path}
              title={module.title}
              description={module.description}
              icon={module.icon}
              status={module.status}
              category={module.category}
              requiredPlan={module.requiredPlan}
              onClick={() => navigate(module.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
