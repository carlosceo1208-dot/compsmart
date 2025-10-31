import { useNavigate } from "react-router-dom";
import { ModuleCard } from "@/components/ModuleCard";
import {
  Users,
  Briefcase,
  TrendingUp,
  FileText,
  Calculator,
  BarChart3,
  DollarSign,
  Target,
  FileSpreadsheet,
  Settings,
  Shield,
  Building,
  ArrowLeftRight,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Cadastro de Funcionários",
      description: "Gerencie informações de funcionários, cargos e vínculos empregatícios",
      icon: Users,
      path: "/employees",
      status: "active" as const,
      category: "management" as const,
    },
    {
      title: "Estrutura Organizacional",
      description: "Configure hierarquia, departamentos, áreas e cargos da empresa",
      icon: Building,
      path: "/organization",
      status: "active" as const,
      category: "management" as const,
    },
    {
      title: "Gestão de Perfis",
      description: "Configure perfis de acesso e permissões por módulo",
      icon: Shield,
      path: "/roles",
      status: "active" as const,
      category: "management" as const,
    },
    {
      title: "Tabela Salarial",
      description: "Defina e gerencie tabelas salariais por cargo e nível",
      icon: DollarSign,
      path: "/salary-ranges",
      status: "active" as const,
      category: "management" as const,
    },
    {
      title: "Pesquisa Salarial",
      description: "Importe e compare dados de mercado",
      icon: TrendingUp,
      path: "/survey-data",
      status: "active" as const,
      category: "management" as const,
    },
    {
      title: "Comparação Salarial",
      description: "Compare tabelas internas vs mercado",
      icon: ArrowLeftRight,
      path: "/salary-comparison",
      status: "active" as const,
      category: "management" as const,
    },
    {
      title: "Plano de Cargos e Salários",
      description: "Configure estrutura de cargos, faixas salariais e progressão",
      icon: Briefcase,
      path: "/job-titles",
      status: "active" as const,
      category: "management" as const,
    },
    {
      title: "People Analytics",
      description: "KPIs de remuneração, diversidade e estrutura organizacional",
      icon: BarChart3,
      path: "/people-analytics",
      status: "active" as const,
      category: "consultation" as const,
    },
    {
      title: "Simulador de Reajuste",
      description: "Simule impactos financeiros de reajustes salariais",
      icon: Calculator,
      path: "/adjustment-simulator",
      status: "coming-soon" as const,
      category: "simulation" as const,
    },
    {
      title: "Análise de Equidade",
      description: "Identifique disparidades salariais por gênero, etnia e outros critérios",
      icon: BarChart3,
      path: "/equity-analysis",
      status: "coming-soon" as const,
      category: "consultation" as const,
    },
    {
      title: "Gestão de Benefícios",
      description: "Administre pacotes de benefícios e suas políticas",
      icon: Target,
      path: "/benefits",
      status: "coming-soon" as const,
      category: "management" as const,
    },
    {
      title: "Relatórios Gerenciais",
      description: "Visualize dashboards e relatórios estratégicos de remuneração",
      icon: FileText,
      path: "/reports",
      status: "coming-soon" as const,
      category: "consultation" as const,
    },
    {
      title: "Exportação de Dados",
      description: "Exporte dados para Excel, PDF e outros formatos",
      icon: FileSpreadsheet,
      path: "/exports",
      status: "coming-soon" as const,
      category: "export" as const,
    },
    {
      title: "Configurações do Sistema",
      description: "Parametrize o sistema e gerencie integrações",
      icon: Settings,
      path: "/settings",
      status: "beta" as const,
      category: "management" as const,
    },
  ];

  const handleModuleClick = (path: string) => {
    navigate(path);
  };

  const activeModules = modules.filter(m => m.status === "active").length;
  const totalModules = modules.length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-br from-primary/10 via-primary-light/20 to-background p-8 shadow-md border border-primary/20">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo ao CompSmart</h1>
        <p className="text-muted-foreground text-lg">
          Sistema modular de gestão de remuneração empresarial
        </p>
        <div className="mt-6 flex gap-6 text-sm">
          <div>
            <span className="text-2xl font-bold text-primary">{activeModules}</span>
            <p className="text-muted-foreground">Módulos Ativos</p>
          </div>
          <div>
            <span className="text-2xl font-bold text-primary">{totalModules}</span>
            <p className="text-muted-foreground">Total de Módulos</p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Módulos do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => (
            <ModuleCard
              key={module.path}
              title={module.title}
              description={module.description}
              icon={module.icon}
              status={module.status}
              category={module.category}
              onClick={module.status === "active" ? () => handleModuleClick(module.path) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-lg bg-muted/50 p-6 border">
        <h3 className="text-lg font-semibold mb-2">Sobre o Sistema</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O CompSmart é uma solução completa para gestão de remuneração empresarial, oferecendo 
          ferramentas integradas para administração de salários, benefícios, pesquisas de mercado, 
          simulações e análises estratégicas. O sistema é modular, permitindo que você utilize apenas 
          os recursos necessários para sua organização.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
