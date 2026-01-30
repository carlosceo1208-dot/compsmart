import { useEffect, useState } from 'react';
import { X, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { kudosCategoryLabels, kudosCategoryEmojis, type KudosCategory } from '@/hooks/usePerformanceKudos';
import { cn } from '@/lib/utils';

interface KudosNotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  kudos: {
    id: string;
    message: string;
    category: KudosCategory;
    fromEmployee?: {
      full_name: string;
      avatar_url: string | null;
      job_title: string | null;
    } | null;
  } | null;
}

export const KudosNotificationPopup = ({ isOpen, onClose, kudos }: KudosNotificationPopupProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen && kudos) {
      // Small delay for entrance animation
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, kudos]);

  // Auto-close after 10 seconds
  useEffect(() => {
    if (isOpen && kudos) {
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, kudos]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/performance/kudos?tab=received');
  };

  if (!isOpen || !kudos) return null;

  const categoryLabel = kudosCategoryLabels[kudos.category];
  const categoryEmoji = kudosCategoryEmojis[kudos.category];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 pointer-events-none">
      <div 
        className={cn(
          "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-indigo-200 dark:border-indigo-800 max-w-md w-full pointer-events-auto overflow-hidden",
          "transition-all duration-300 ease-out",
          isVisible && !isAnimatingOut 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-4"
        )}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 p-4 text-white relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute right-2 top-2 h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Você recebeu um Kudos! 🎉</h2>
              <p className="text-sm text-white/80">Alguém reconheceu seu trabalho</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Sender info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-indigo-100 dark:ring-indigo-900">
              <AvatarImage src={kudos.fromEmployee?.avatar_url || undefined} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                {kudos.fromEmployee?.full_name ? getInitials(kudos.fromEmployee.full_name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">De:</p>
              <p className="font-semibold text-foreground">
                {kudos.fromEmployee?.full_name || 'Anônimo'}
              </p>
              {kudos.fromEmployee?.job_title && (
                <p className="text-xs text-muted-foreground">{kudos.fromEmployee.job_title}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 text-sm px-3 py-1"
            >
              <span className="mr-1.5">{categoryEmoji}</span>
              {categoryLabel}
            </Badge>
          </div>

          {/* Message */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-foreground italic leading-relaxed">
              "{kudos.message}"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Fechar
          </Button>
          <Button
            onClick={handleViewAll}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            Ver Todos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
