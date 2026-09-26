import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export const WhatsAppFloat = () => {
  const [proofVisibleOnMobile, setProofVisibleOnMobile] = useState(false);

  useEffect(() => {
    const proof = document.getElementById("visual-proof");
    const mobile = window.matchMedia("(max-width: 639px)");
    if (!proof) return;

    const observer = new IntersectionObserver(
      ([entry]) => setProofVisibleOnMobile(mobile.matches && entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(proof);

    const handleViewportChange = () => {
      if (!mobile.matches) setProofVisibleOnMobile(false);
    };
    mobile.addEventListener("change", handleViewportChange);

    return () => {
      observer.disconnect();
      mobile.removeEventListener("change", handleViewportChange);
    };
  }, []);

  return (
    <Link
      to="/contato"
      aria-label="Contato"
      aria-hidden={proofVisibleOnMobile}
      tabIndex={proofVisibleOnMobile ? -1 : undefined}
      className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-[opacity,transform,background-color] hover:bg-primary/90 sm:bottom-5 sm:right-5 sm:px-4 sm:py-3 ${
        proofVisibleOnMobile ? "pointer-events-none translate-y-2 opacity-0" : "opacity-100"
      }`}
    >
      <Mail className="h-5 w-5" />
      <span className="hidden text-sm font-semibold sm:inline">CONTATO</span>
    </Link>
  );
};
