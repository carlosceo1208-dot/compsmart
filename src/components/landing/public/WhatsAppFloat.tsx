import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

export const WhatsAppFloat = () => (
  <Link
    to="/contato"
    aria-label="Contato"
    className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
  >
    <Mail className="h-5 w-5" />
    <span className="text-sm font-semibold">CONTATO</span>
  </Link>
);
