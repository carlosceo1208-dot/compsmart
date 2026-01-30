import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePerformAI } from "@/hooks/usePerformAI";
import { PerformAIChat } from "./PerformAIChat";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const PerformAIWidget = () => {
  const { isOpen, setIsOpen, messages } = usePerformAI();

  const hasUnreadMessages = messages.length > 0 && !isOpen;

  return (
    <>
      {/* Floating button */}
      <TooltipProvider>
        <div className="fixed bottom-6 right-24 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className={cn(
                  "h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110",
                  "bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800",
                  hasUnreadMessages && "animate-pulse"
                )}
              >
                {isOpen ? (
                  <X className="h-6 w-6 text-white" />
                ) : (
                  <>
                    <Bot className="h-6 w-6 text-white" />
                    {hasUnreadMessages && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        !
                      </span>
                    )}
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isOpen ? "Fechar" : "PerformAI - Assistente de Desempenho"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Chat widget */}
      {isOpen && <PerformAIChat onClose={() => setIsOpen(false)} />}
    </>
  );
};
