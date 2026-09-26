import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

export const WhatsAppFloat = () => (
  <Link
    to="/contato"
    aria-label="Contato"
    className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 sm:bottom-5 sm:right-5 sm:px-4 sm:py-3"
  >
    <Mail className="h-5 w-5" />
    <span className="hidden text-sm font-semibold sm:inline">CONTATO</span>
  </Link>
);
