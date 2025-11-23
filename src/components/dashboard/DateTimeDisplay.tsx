import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DateTimeDisplay = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Atualiza a cada 1 minuto

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end gap-1 text-xs sm:text-sm">
      <div className="flex items-center gap-1.5 sm:gap-2 text-white/90">
        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="font-medium whitespace-nowrap">
          {format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 text-white/80">
        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="whitespace-nowrap">
          {format(currentDate, 'EEEE', { locale: ptBR })} • {format(currentDate, 'HH:mm')}
        </span>
      </div>
    </div>
  );
};
