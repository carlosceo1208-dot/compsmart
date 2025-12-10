import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

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
  const [hasCompletedTour, setHasCompletedTour] = useState<boolean | null>(null);
  const { plan } = useFeatureAccess();

  useEffect(() => {
    const checkTourStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('has_completed_tour')
        .eq('id', user.id)
        .single();

      if (profile) {
        setHasCompletedTour(profile.has_completed_tour ?? false);
        if (!profile.has_completed_tour) {
          // Small delay to ensure DOM elements are ready
          setTimeout(() => setRunTour(true), 1000);
        }
      }
    };

    checkTourStatus();
  }, []);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      
      // Mark tour as completed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ has_completed_tour: true })
          .eq('id', user.id);
      }
      
      setHasCompletedTour(true);
      onComplete?.();
    }
  };

  if (hasCompletedTour === null || hasCompletedTour === true) {
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
