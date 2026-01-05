import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';
import { FeedbackDialog } from './FeedbackDialog';
import { useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpen(true)}
              size="icon"
              className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
              aria-label="Enviar feedback"
            >
              <Lightbulb className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Envie sua sugestão</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <FeedbackDialog
        open={open}
        onOpenChange={setOpen}
        pageUrl={location.pathname}
      />
    </>
  );
}
