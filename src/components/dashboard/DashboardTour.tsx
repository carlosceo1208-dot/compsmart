import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useTheme } from 'next-themes';

const TOUR_STORAGE_KEY = 'compsmart_tour_completed';

// Função exportada para reiniciar o tour
export const resetDashboardTour = () => {
  localStorage.removeItem(TOUR_STORAGE_KEY);
};

const tourSteps: Step[] = [
  {
    target: '.dashboard-welcome',
    content: (
      <div className="text-left">
        <h3 className="font-semibold text-base mb-1">Bem-vindo ao CompSmart!</h3>
        <p className="text-sm text-muted-foreground">
          Dashboard executivo para gestão inteligente de remuneração.
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
        <h3 className="font-semibold text-base mb-1">Agentes Smart</h3>
        <p className="text-sm text-muted-foreground">
          Assistentes de IA: Jurídico Smart, Salary Smart e R&B Smart.
        </p>
        <p className="text-xs text-amber-600 mt-1">⭐ Plano Pro</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '.analytics-section',
    content: (
      <div className="text-left">
        <h3 className="font-semibold text-base mb-1">Analytics & Relatórios</h3>
        <p className="text-sm text-muted-foreground">
          KPIs, tendências e relatórios em tempo real.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '.management-section',
    content: (
      <div className="text-left">
        <h3 className="font-semibold text-base mb-1">Gestão e Configuração</h3>
        <p className="text-sm text-muted-foreground">
          Funcionários, cargos, tabelas e benefícios.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '.locked-module',
    content: (
      <div className="text-left">
        <h3 className="font-semibold text-base mb-1">Módulos Premium</h3>
        <p className="text-sm text-muted-foreground">
          Cadeado = upgrade necessário. Clique para ver benefícios!
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '.dashboard-welcome',
    content: (
      <div className="text-left">
        <h3 className="font-semibold text-base mb-1">Pronto!</h3>
        <p className="text-sm text-muted-foreground">
          Explore os módulos do seu plano. Bom trabalho!
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
  const { theme, setTheme } = useTheme();
  
  // Verifica localStorage imediatamente na inicialização
  const [hasCompletedTour] = useState(() => 
    localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
  );
  const [runTour, setRunTour] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [originalTheme, setOriginalTheme] = useState<string | undefined>();

  useEffect(() => {
    setMounted(true);
    
    // Só dispara se NUNCA completou o tour
    if (!hasCompletedTour) {
      const timer = setTimeout(() => setRunTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour]);

  // Quando o tour começa, salvar tema original e mudar para dark
  useEffect(() => {
    if (runTour && !originalTheme) {
      setOriginalTheme(theme);
      setTheme('dark');
    }
  }, [runTour, theme, setTheme, originalTheme]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      
      // Restaurar tema original do usuário
      if (originalTheme) {
        setTheme(originalTheme);
      }
      
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      onComplete?.();
    }
  };

  // Não renderiza se já completou ou não está montado
  if (!mounted || hasCompletedTour) {
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
        skip: 'Pular',
      }}
      styles={{
        options: {
          primaryColor: '#10b981',
          textColor: '#ffffff',
          backgroundColor: '#1f2937',
          arrowColor: '#1f2937',
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '10px',
          padding: '14px',
          border: '2px solid #10b981',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
          maxWidth: '320px',
        },
        tooltipContent: {
          padding: '0',
          color: '#ffffff',
        },
        buttonNext: {
          backgroundColor: '#10b981',
          borderRadius: '6px',
          padding: '6px 14px',
          fontSize: '13px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: '8px',
          fontSize: '13px',
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: '12px',
        },
        spotlight: {
          borderRadius: '10px',
        },
      }}
    />
  );
};
