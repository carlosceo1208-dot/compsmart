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
    <div className="flex flex-col items-end gap-1 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="font-medium">
          {format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          {format(currentDate, 'EEEE', { locale: ptBR })} • {format(currentDate, 'HH:mm')}
        </span>
      </div>
    </div>
  );
};
