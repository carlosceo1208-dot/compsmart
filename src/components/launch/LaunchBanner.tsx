import { Rocket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const LaunchBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 p-1 animate-pulse-slow">
      <div className="relative bg-background/95 backdrop-blur-sm rounded-xl p-6 md:p-8">
        {/* Efeito de brilho */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/10 animate-shimmer" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Ícone de foguete animado */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-amber-500 to-yellow-600 p-3 rounded-full animate-bounce-slow">
                <Rocket className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Lançamento Oficial
                </span>
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 via-yellow-500 to-emerald-600 bg-clip-text text-transparent">
                Estamos Oficialmente no Ar!
              </h2>
              <p className="text-muted-foreground mt-1">
                CompSmart - A nova era da gestão de remuneração estratégica
              </p>
            </div>
          </div>
          
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Começar Agora - Grátis por 30 dias
          </Button>
        </div>
      </div>
    </div>
  );
};
