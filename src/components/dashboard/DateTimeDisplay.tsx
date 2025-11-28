import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const TIMEZONE = 'America/Sao_Paulo';

export const DateTimeDisplay = () => {
  const [currentDate, setCurrentDate] = useState(() => 
    toZonedTime(new Date(), TIMEZONE)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(toZonedTime(new Date(), TIMEZONE));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end gap-0.5 text-[10px] sm:text-xs">
      <div className="flex items-center gap-1 text-white/90">
        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
        <span className="font-medium whitespace-nowrap">
          {format(currentDate, "dd MMM yyyy", { locale: ptBR })}
        </span>
      </div>
      <div className="flex items-center gap-1 text-white/80">
        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
        <span className="whitespace-nowrap capitalize">
          {format(currentDate, 'EEE', { locale: ptBR })} • {format(currentDate, 'HH:mm')}
        </span>
      </div>
    </div>
  );
};
