import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const LanguageSelector = ({ variant = 'compact', className }: LanguageSelectorProps) => {
  const { currentLanguage, changeLanguage, isLoading, supportedLanguages } = useLanguage();

  const currentLangData = supportedLanguages.find(l => l.code === currentLanguage);

  if (variant === 'full') {
    return (
      <div className={cn('space-y-2', className)}>
        {supportedLanguages.map((lang) => (
          <Button
            key={lang.code}
            variant={currentLanguage === lang.code ? 'default' : 'outline'}
            className={cn(
              'w-full justify-start gap-3',
              currentLanguage === lang.code && 'bg-emerald-500 hover:bg-emerald-600'
            )}
            onClick={() => changeLanguage(lang.code)}
            disabled={isLoading}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1 text-left">{lang.name}</span>
            {currentLanguage === lang.code && (
              <Check className="h-4 w-4" />
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-300 dark:ring-emerald-700 transition-all duration-300 hover:scale-105 flex-shrink-0',
            className
          )}
          disabled={isLoading}
          title={currentLangData?.name || 'Language'}
        >
          <span className="text-sm">{currentLangData?.flag || '🌐'}</span>
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-700 shadow-xl z-50">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              'flex items-center gap-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
              currentLanguage === lang.code && 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {currentLanguage === lang.code && (
              <Check className="h-4 w-4 text-emerald-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
