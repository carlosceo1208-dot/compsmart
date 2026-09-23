import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE } from "@/config/landingModules";

export const WhatsAppFloat = () => (
  <a
    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Falar pelo WhatsApp"
    className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#16A34A] px-4 py-3 text-white shadow-lg hover:brightness-110 transition"
  >
    <MessageCircle className="h-5 w-5" />
    <span className="hidden sm:inline text-sm font-semibold">WhatsApp</span>
  </a>
);
