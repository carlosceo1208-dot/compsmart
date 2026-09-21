import { useNavigate } from 'react-router-dom';
import { ModuleCard } from '@/components/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { useModuleAccess, type ModuleSlug } from '@/hooks/useModuleAccess';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { toast } from 'sonner';
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
  AlertTriangle,
  FileText,
  Brain,
  Search,
  GraduationCap,
  Handshake,
} from 'lucide-react';

interface ModuleDefinition {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  status: 'active' | 'coming-soon' | 'beta';
  category: 'management' | 'consultation';
  moduleSlugs?: ModuleSlug[];
  requireAll?: boolean;
  customCta?: string;
  customLockedDescription?: string;
  isTransversal?: boolean;
  legacyFeature?: string;
}

export const ModuleGrid = () => {
  const navigate = useNavigate();
  const moduleAccess = useModuleAccess();
  const legacyAccess = useFeatureAccess();

  const moduleCta = (slugs: ModuleSlug[], requireAll = false) => {
    const names = slugs.map((slug) => moduleAccess.getModuleName(slug));
    if (names.length === 0) return 'Ativar módulo';
    if (names.length === 1) return `Ativar módulo ${names[0]}`;
    const connector = requireAll ? ' e ' : ' ou ';
    return `Ativar ${names.join(connector)}`;
  };

  const lockedDescription = (slugs: ModuleSlug[], requireAll = false) => {
    const names = slugs.map((slug) => moduleAccess.getModuleName(slug));
    if (names.length === 0) return undefined;
    if (names.length === 1) return `Disponível para empresas com ${names[0]} contratado.`;
    return `Disponível para empresas com ${names.join(requireAll ? ' e ' : ' ou ')} contratado.`;
  };

  const handleLockedClick = (module: ModuleDefinition) => {
    const slugs = module.moduleSlugs ?? [];
    toast.info(module.customCta ?? moduleCta(slugs, module.requireAll), {
      description: module.customLockedDescription ?? lockedDescription(slugs, module.requireAll),
    });
  };

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
      title: 'Colaboradores',
      description: 'Gerencie informações dos colaboradores',
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
      description: 'Configure seus dados e acesso seguro',
      icon: UserCircle,
      path: '/my-profile',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Tabela Salarial',
      description: 'Gerencie faixas, curvas e estruturas salariais',
      icon: DollarSign,
      path: '/salary-ranges',
      status: 'active',
      category: 'management',
      moduleSlugs: ['core'],
    },
    {
      title: 'Plano de Cargos e Avaliação',
      description: 'Configure cargos, níveis e avaliação de desempenho',
      icon: Briefcase,
      path: '/job-titles',
      status: 'active',
      category: 'management',
      moduleSlugs: ['core'],
    },
    {
      title: 'Programas de Incentivos',
      description: 'Gerencie ICP, ILP, PLR e Stock Options',
      icon: Target,
      path: '/incentive-programs',
      status: 'active',
      category: 'management',
      moduleSlugs: ['core'],
    },
    {
      title: 'Aprovações de Orçamento',
      description: 'Revise, aprove orçamentos e consulte evolução orçamentária',
      icon: FileCheck,
      path: '/budget-approvals',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Base de Conhecimento',
      description: 'Gerencie documentos de referência para os Agentes Smart',
      icon: BookOpen,
      path: '/knowledge-base',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Auditoria de Acesso',
      description: 'Logs e relatórios de uso dos Agentes Smart',
      icon: Shield,
      path: '/audit-logs',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Auditoria de Dados',
      description: 'Verificar e corrigir inconsistências de dados',
      icon: AlertTriangle,
      path: '/data-audit',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Alertas Automáticos',
      description: 'Configure alertas de monitoramento dos agentes',
      icon: Bell,
      path: '/alert-settings',
      status: 'active',
      category: 'management',
    },
    {
      title: 'Configurações - Parametrização',
      description: 'Personalize nomenclaturas e ajuste parâmetros do sistema',
      icon: Settings,
      path: '/settings',
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
      moduleSlugs: ['core'],
      customCta: `Conhecer o módulo ${moduleAccess.getModuleName('core')}`,
      isTransversal: true,
      legacyFeature: 'people_analytics',
    },
    {
      title: 'Pesquisa Salarial',
      description: 'Compare dados de mercado',
      icon: TrendingUp,
      path: '/survey-data',
      status: 'active',
      category: 'management',
      moduleSlugs: ['insight'],
    },
    {
      title: 'Comparação Salarial',
      description: 'Compare tabelas vs mercado',
      icon: ArrowLeftRight,
      path: '/salary-comparison',
      status: 'active',
      category: 'management',
      moduleSlugs: ['insight'],
    },
    {
      title: 'Benchmark de Mercado',
      description: 'Competitividade, compa-ratio e defasagem salarial',
      icon: TrendingUp,
      path: '/market-benchmark',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['insight'],
    },
    {
      title: 'Job Matching',
      description: 'Descrição de cargos, CBO e comparação por metodologia',
      icon: Search,
      path: '/job-matching',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['match'],
    },
    {
      title: 'Saúde Mental & Bem-Estar (NR-1)',
      description: 'Diagnóstico, planos de ação e conformidade NR-1',
      icon: Brain,
      path: '/nr1/painel',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['nr1'],
    },
    {
      title: 'Clima Organizacional',
      description: 'Pesquisa de clima, eNPS, engajamento e cultura',
      icon: Users,
      path: '/nr1/clima',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['clima'],
    },
    {
      title: 'Seleção & Recrutamento',
      description: 'Vagas, candidatos, triagem e match de perfil',
      icon: Users,
      path: '/dashboard',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['talent'],
    },
    {
      title: 'Treinamento & PDI',
      description: 'Trilhas, PDI e desenvolvimento por gaps',
      icon: GraduationCap,
      path: '/performance/pdi',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['evolve'],
    },
    {
      title: 'Avaliação de Potencial e Sucessão',
      description: '9-Box, talentos-chave e planos de sucessão',
      icon: BarChart3,
      path: '/performance/9box',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['potencial-sucessao'],
    },
    {
      title: 'RH Service',
      description: 'Consultoria com consultores seniores por demanda',
      icon: Handshake,
      path: '/rh-service',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['rh-service'],
    },
    {
      title: 'Jurídico Smart',
      description: 'Consultoria trabalhista e previdenciária com IA',
      icon: Scale,
      path: '/legal-assistant',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['core'],
      customCta: `Conhecer o módulo ${moduleAccess.getModuleName('core')}`,
      isTransversal: true,
      legacyFeature: 'legal_assistant',
    },
    {
      title: 'Salary Smart',
      description: 'IA para estruturas, faixas e benchmarking salarial',
      icon: TrendingUp,
      path: '/salary-assistant',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['core'],
    },
    {
      title: 'R&B Smart',
      description: 'Consultas sobre Remuneração e Benefícios com IA',
      icon: Bot,
      path: '/incentive-assistant',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['core'],
      customCta: `Conhecer o módulo ${moduleAccess.getModuleName('core')}`,
      isTransversal: true,
      legacyFeature: 'incentive_assistant',
    },
    {
      title: 'Total Rewards',
      description: 'Demonstrativo de remuneração total por colaborador',
      icon: FileText,
      path: '/total-rewards',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['core'],
    },
    {
      title: 'Análise Salarial',
      description: 'Relatório de posicionamento salarial',
      icon: FileBarChart,
      path: '/salary-analysis-report',
      status: 'active',
      category: 'consultation',
      moduleSlugs: ['core'],
    },
  ];

  const smartAgents = activeModules.filter((m) =>
    m.path.includes('assistant') || m.path === '/salary-assistant'
  );

  const analyticsModules = activeModules.filter((m) =>
    m.category === 'consultation' && !smartAgents.some((agent) => agent.path === m.path)
  );

  const managementModules = activeModules.filter((m) =>
    m.category === 'management'
  );

  const renderModule = (module: ModuleDefinition, index = 0, isSmartAgent = false) => {
    const slugs = module.moduleSlugs ?? [];
    const hasLegacyAccess = module.legacyFeature ? legacyAccess.hasAccess(module.legacyFeature) : false;
    const hasModuleAccess = slugs.length === 0 || (module.requireAll ? moduleAccess.hasAllModules(slugs) : moduleAccess.hasAnyModule(slugs));
    const hasAccess = hasModuleAccess || hasLegacyAccess;
    const locked = !(moduleAccess.loading || (!!module.legacyFeature && legacyAccess.loading)) && !hasAccess;
    const lockCta = module.customCta ?? moduleCta(slugs, module.requireAll);

    return (
      <ModuleCard
        key={module.path + module.title}
        title={module.title}
        description={module.description}
        icon={module.icon}
        status={module.status}
        category={module.category}
        onClick={() => navigate(module.path)}
        isSmartAgent={isSmartAgent}
        index={index}
        locked={locked}
        lockCta={lockCta}
        lockDescription={module.customLockedDescription ?? lockedDescription(slugs, module.requireAll)}
        onLockedClick={() => handleLockedClick(module)}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="smart-agents-section">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Agentes Smart
          </h3>
          <Badge className="ml-2 bg-gradient-primary border-0 shadow-primary">
            IA
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {smartAgents.map((module, index) => renderModule(module, index, true))}
        </div>
      </div>

      <div className="analytics-section">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Analytics & Relatórios</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {analyticsModules.map((module, index) => renderModule(module, index))}
        </div>
      </div>

      <div className="management-section">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Gestão e Configuração</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {managementModules.map((module, index) => renderModule(module, index))}
        </div>
      </div>
    </div>
  );
};