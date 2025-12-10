import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const TOUR_STORAGE_KEY = 'compsmart_tour_completed';

const tourSteps: Step[] = [
  {
    target: '.dashboard-welcome',
    content: (
      <div className="text-left">
        <h3 className="font-bold text-lg mb-2">Bem-vindo ao CompSmart! 🎉</h3>
        <p className="text-muted-foreground">
          Este é seu dashboard executivo para gestão inteligente de remuneração.
          Vamos fazer um tour rápido pelos módulos disponíveis!
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.smart-agents-section',
    content: (
      <div className="text-left">
        <h3 className="font-bold text-lg mb-2">Agentes Smart 🤖</h3>
        <p className="text-muted-foreground mb-2">
          Assistentes de IA especializados em:
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li><strong>Jurídico</strong> - Consultoria trabalhista</li>
          <li><strong>Análise Salarial</strong> - Benchmarking e estruturas</li>
          <li><strong>R&B</strong> - Remuneração e Benefícios</li>
        </ul>
        <p className="text-xs text-amber-600 mt-2">
          ⭐ Disponível no Plano Pro
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '.analytics-section',
    content: (
      <div className="text-left">
        <h3 className="font-bold text-lg mb-2">Analytics & Relatórios 📊</h3>
        <p className="text-muted-foreground">
          Visualize KPIs, tendências e relatórios de remuneração.
          Acompanhe a saúde salarial da sua empresa em tempo real.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '.management-section',
    content: (
      <div className="text-left">
        <h3 className="font-bold text-lg mb-2">Gestão e Configuração ⚙️</h3>
        <p className="text-muted-foreground">
          Gerencie funcionários, cargos, tabelas salariais, benefícios 
          e toda a estrutura organizacional da sua empresa.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '.locked-module',
    content: (
      <div className="text-left">
        <h3 className="font-bold text-lg mb-2">Módulos Premium 🔒</h3>
        <p className="text-muted-foreground mb-2">
          Módulos com cadeado requerem upgrade de plano.
          Clique neles para ver os benefícios e fazer upgrade!
        </p>
        <div className="text-xs space-y-1 mt-3 p-2 bg-muted rounded">
          <p><strong>Starter:</strong> Funcionalidades básicas</p>
          <p><strong>Medium:</strong> Orçamento e auditoria</p>
          <p><strong>Pro:</strong> Agentes Smart com IA</p>
        </div>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '.dashboard-welcome',
    content: (
      <div className="text-left">
        <h3 className="font-bold text-lg mb-2">Pronto para começar! 🚀</h3>
        <p className="text-muted-foreground">
          Explore os módulos disponíveis no seu plano.
          Qualquer dúvida, nossa equipe está pronta para ajudar!
        </p>
      </div>
    ),
    placement: 'center',
  },
];

interface DashboardTourProps {
  onComplete?: () => void;
}

export const DashboardTour = ({ onComplete }: DashboardTourProps) => {
  const [runTour, setRunTour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    
    if (!hasCompletedTour) {
      // Small delay to ensure DOM elements are ready
      const timer = setTimeout(() => setRunTour(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      onComplete?.();
    }
  };

  // Don't render until mounted to avoid SSR issues
  if (!mounted) {
    return null;
  }

  return (
    <Joyride
      steps={tourSteps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
          arrowColor: 'hsl(var(--card))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
        },
        tooltipContent: {
          padding: '0',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '8px',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
        spotlight: {
          borderRadius: '12px',
        },
      }}
    />
  );
};
