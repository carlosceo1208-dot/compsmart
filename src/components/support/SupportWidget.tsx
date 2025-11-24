import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupport } from "@/hooks/useSupport";
import { SupportChat } from "./SupportChat";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const SupportWidget = () => {
  const { isOpen, setIsOpen, messages } = useSupport();

  const hasUnreadMessages = messages.length > 0 && !isOpen;

  return (
    <>
      {/* Floating button */}
      <TooltipProvider>
        <div className="fixed bottom-6 right-6 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className={cn(
                  "h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110",
                  "bg-success hover:bg-success/90",
                  hasUnreadMessages && "animate-pulse"
                )}
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <>
                    <MessageCircle className="h-6 w-6" />
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
              <p>{isOpen ? "Fechar" : "Ajuda"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Chat widget */}
      {isOpen && <SupportChat />}
    </>
  );
};