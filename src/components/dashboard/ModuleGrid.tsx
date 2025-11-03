import { useNavigate } from 'react-router-dom';
import { ModuleCard } from '@/components/ModuleCard';
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
} from 'lucide-react';

interface ModuleGridProps {
  maxVisible?: number;
}

export const ModuleGrid = ({ maxVisible = 12 }: ModuleGridProps) => {
  const navigate = useNavigate();

  const activeModules = [
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
      title: 'Estrutura Organizacional',
      description: 'Configure hierarquia e departamentos',
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
      title: 'Configurações',
      description: 'Parametrize o sistema',
      icon: Settings,
      path: '/settings',
      status: 'beta' as const,
      category: 'management' as const,
    },
  ];

  const visibleModules = activeModules.slice(0, maxVisible);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Módulos Ativos</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visibleModules.map((module) => (
          <ModuleCard
            key={module.path}
            title={module.title}
            description={module.description}
            icon={module.icon}
            status={module.status}
            category={module.category}
            onClick={() => navigate(module.path)}
          />
        ))}
      </div>
    </div>
  );
};
