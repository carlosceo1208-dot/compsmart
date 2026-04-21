import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { EconomicIndicatorsCard } from '@/components/dashboard/EconomicIndicatorsCard';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Crown, Search, ArrowRight, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NavItem {
  label: string;
  path: string;
  category: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Análise Salarial (Relatório)', path: '/salary-analysis-report', category: 'Insight' },
  { label: 'Aprovações de Budget', path: '/budget-approvals', category: 'Core' },
  { label: 'Assistente Jurídico', path: '/legal-assistant', category: 'IA' },
  { label: 'Assistente de Incentivos', path: '/incentive-assistant', category: 'IA' },
  { label: 'Assistente Salarial', path: '/salary-assistant', category: 'IA' },
  { label: 'Auditoria de Dados', path: '/data-audit', category: 'Core' },
  { label: 'Avaliações de Desempenho', path: '/performance/evaluations', category: 'Performance' },
  { label: 'Benefícios', path: '/benefits', category: 'Core' },
  { label: 'Budget Planning', path: '/budget-planning', category: 'Core' },
  { label: 'Cargos', path: '/job-titles', category: 'Core' },
  { label: 'Ciclos de Performance', path: '/performance/cycles', category: 'Performance' },
  { label: 'Colaboradores', path: '/employees', category: 'Core' },
  { label: 'Controle de Acesso', path: '/access-control', category: 'Admin' },
  { label: 'Dashboard Operacional', path: '/dashboard', category: 'Geral' },
  { label: 'Equidade Salarial', path: '/equity', category: 'Equity' },
  { label: 'Estrutura Organizacional', path: '/organization', category: 'Core' },
  { label: 'Faixas Salariais', path: '/salary-ranges', category: 'Core' },
  { label: 'Feedback 360°', path: '/performance/feedback-360', category: 'Performance' },
  { label: 'Incentivos (Programas)', path: '/incentive-programs', category: 'Insight' },
  { label: 'Job Matching (IA)', path: '/job-matching', category: 'Match' },
  { label: 'Kudos', path: '/performance/kudos', category: 'Performance' },
  { label: 'Market Benchmark', path: '/market-benchmark', category: 'Insight' },
  { label: 'Metas (Goals)', path: '/performance/goals', category: 'Performance' },
  { label: 'Organograma', path: '/organograma', category: 'Core' },
  { label: 'Pay Equity (LGPD)', path: '/pay-equity', category: 'Equity' },
  { label: 'PDI', path: '/performance/pdi', category: 'Performance' },
  { label: 'People Analytics', path: '/people-analytics', category: 'Analytics' },
  { label: 'Performance 9Box', path: '/performance/9box', category: 'Performance' },
  { label: 'Performance Dashboard', path: '/performance', category: 'Performance' },
  { label: 'Pesquisas Salariais', path: '/survey-data', category: 'Insight' },
  { label: 'Remuneração Executiva (LTIP)', path: '/executive-compensation', category: 'Executive' },
  { label: 'Sucessão', path: '/performance/succession', category: 'Performance' },
  { label: 'Talent Intelligence', path: '/talent-intelligence', category: 'Talent' },
  { label: 'Total Rewards', path: '/total-rewards', category: 'Core' },
];

const categoryColors: Record<string, string> = {
  Core: 'bg-blue-500/10 text-blue-700',
  Insight: 'bg-purple-500/10 text-purple-700',
  Match: 'bg-amber-500/10 text-amber-700',
  Performance: 'bg-green-500/10 text-green-700',
  Equity: 'bg-pink-500/10 text-pink-700',
  Executive: 'bg-red-500/10 text-red-700',
  Talent: 'bg-cyan-500/10 text-cyan-700',
  IA: 'bg-violet-500/10 text-violet-700',
  Admin: 'bg-slate-500/10 text-slate-700',
  Analytics: 'bg-indigo-500/10 text-indigo-700',
  Geral: 'bg-muted text-muted-foreground',
};

export default function ExecutiveDashboard() {
  const { data: role } = useCurrentUserRole();
  const allowed = role?.isAdmin || role?.isSuperAdmin || role?.isHR;
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Dashboard Executivo | CompSmart';
  }, []);

  const grouped = useMemo(() => {
    const filtered = NAV_ITEMS.filter(i =>
      i.label.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

    const map: Record<string, NavItem[]> = {};
    filtered.forEach(item => {
      const letter = item.label[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(item);
    });
    return map;
  }, [search]);

  if (!allowed) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>Apenas Admin/RH/Super Admin podem acessar a visão executiva.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Crown className="h-7 w-7 text-primary" />
            Dashboard Executivo
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão CEO/CFO — indicadores macro, navegação alfabética e atalhos para todos os módulos.
          </p>
        </div>
      </header>

      {/* Indicadores macro em destaque no topo */}
      <EconomicIndicatorsCard />

      {/* Busca e navegação alfabética */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Navegação Rápida</CardTitle>
          <CardDescription>
            Todos os módulos do CompSmart em ordem alfabética. Use a busca para filtrar.
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-1" />
            <Input
              placeholder="Buscar módulo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(grouped).length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Nenhum módulo encontrado.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([letter, items]) => (
                <div key={letter}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-md bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                      {letter}
                    </div>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="group flex items-center justify-between gap-2 p-2.5 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] shrink-0 ${categoryColors[item.category] || ''}`}
                          >
                            {item.category}
                          </Badge>
                          <span className="text-sm truncate">{item.label}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
