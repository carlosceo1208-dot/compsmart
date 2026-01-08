import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

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
        <h3 className="font-semibold text-base mb-1 text-gray-800">Bem-vindo ao CompSmart!</h3>
        <p className="text-sm text-gray-600">
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
        <h3 className="font-semibold text-base mb-1 text-gray-800">Agentes Smart</h3>
        <p className="text-sm text-gray-600">
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
        <h3 className="font-semibold text-base mb-1 text-gray-800">Analytics & Relatórios</h3>
        <p className="text-sm text-gray-600">
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
        <h3 className="font-semibold text-base mb-1 text-gray-800">Gestão e Configuração</h3>
        <p className="text-sm text-gray-600">
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
        <h3 className="font-semibold text-base mb-1 text-gray-800">Módulos Premium</h3>
        <p className="text-sm text-gray-600">
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
        <h3 className="font-semibold text-base mb-1 text-gray-800">Pronto!</h3>
        <p className="text-sm text-gray-600">
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
  // Verifica localStorage imediatamente na inicialização
  const [hasCompletedTour] = useState(() => 
    localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
  );
  const [runTour, setRunTour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Só dispara se NUNCA completou o tour
    if (!hasCompletedTour) {
      const timer = setTimeout(() => setRunTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
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
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '10px',
          padding: '14px',
          border: '2px solid #10b981',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
          maxWidth: '320px',
        },
        tooltipContent: {
          padding: '0',
          color: '#374151',
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
