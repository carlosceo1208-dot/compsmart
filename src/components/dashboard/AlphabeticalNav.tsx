import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNavigate, useLocation } from 'react-router-dom';
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
  PiggyBank,
} from 'lucide-react';

interface Module {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'active' | 'beta' | 'coming-soon';
}

const moduleGroups: Record<string, Module[]> = {
  'A-C': [
    { title: 'Análise de Equidade', path: '/equity-analysis', icon: BarChart3, status: 'coming-soon' },
    { title: 'Comparação Salarial', path: '/salary-comparison', icon: ArrowLeftRight, status: 'active' },
    { title: 'Configurações - Parametrização', path: '/settings', icon: Settings, status: 'active' },
  ],
  'D-F': [
    { title: 'Estrutura Organizacional', path: '/organization', icon: Building, status: 'active' },
    { title: 'Exportação de Dados', path: '/exports', icon: FileSpreadsheet, status: 'coming-soon' },
    { title: 'Funcionários', path: '/employees', icon: Users, status: 'active' },
  ],
  'G-P': [
    { title: 'Gestão de Benefícios', path: '/benefits', icon: Target, status: 'coming-soon' },
    { title: 'Gestão de Perfis', path: '/roles', icon: Shield, status: 'active' },
    { title: 'Orçamento', path: '/budget', icon: PiggyBank, status: 'active' },
    { title: 'People Analytics', path: '/people-analytics', icon: BarChart3, status: 'active' },
    { title: 'Pesquisa Salarial', path: '/survey-data', icon: TrendingUp, status: 'active' },
    { title: 'Plano de Cargos', path: '/job-titles', icon: Briefcase, status: 'active' },
  ],
  'R-S': [
    { title: 'Relatórios Gerenciais', path: '/reports', icon: FileText, status: 'coming-soon' },
    { title: 'Simulador de Reajuste', path: '/adjustment-simulator', icon: Calculator, status: 'coming-soon' },
  ],
  'T-Z': [
    { title: 'Tabela Salarial', path: '/salary-ranges', icon: DollarSign, status: 'active' },
  ],
};

export const AlphabeticalNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Navegação Rápida</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Object.entries(moduleGroups).map(([group, modules]) => (
            <Popover key={group}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`min-w-[60px] ${modules.some(m => isCurrentPath(m.path)) ? 'border-primary bg-primary/5' : ''}`}
                >
                  {group}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm mb-3">Módulos {group}</h4>
                  {modules.map((module) => (
                    <Button
                      key={module.path}
                      variant={isCurrentPath(module.path) ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => module.status === 'active' && navigate(module.path)}
                      disabled={module.status !== 'active'}
                    >
                      <module.icon className="h-4 w-4 mr-2" />
                      <span className="flex-1 text-left">{module.title}</span>
                      {module.status === 'beta' && (
                        <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">Beta</span>
                      )}
                      {module.status === 'coming-soon' && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Em breve</span>
                      )}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
