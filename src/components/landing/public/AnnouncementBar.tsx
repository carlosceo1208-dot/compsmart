import { useLocation } from "react-router-dom";

export const ANNOUNCEMENT_TEXT =
  "🚧 Estamos reconstruindo a CompSmart para oferecer ainda mais apoio ao RH. Em breve, muitas novidades.";

/** Portal de vagas fica sem a faixa para não confundir o candidato. */
export const useShowAnnouncement = () => !useLocation().pathname.startsWith("/vagas");

/** Faixa "em reconstrução". `spacer` reserva a mesma altura, invisível, sob o header fixo. */
export const AnnouncementBar = ({ spacer = false }: { spacer?: boolean }) => {
  const show = useShowAnnouncement();
  if (!show) return null;
  return (
    <div
      role={spacer ? undefined : "status"}
      aria-hidden={spacer || undefined}
      className={`w-full bg-primary text-primary-foreground ${spacer ? "invisible" : "animate-fade-in motion-reduce:animate-none"}`}
    >
      <p className="container mx-auto px-4 py-1.5 flex items-center justify-center gap-2 text-center text-xs sm:text-sm font-medium leading-snug">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75 animate-ping motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
        </span>
        <span>{ANNOUNCEMENT_TEXT}</span>
      </p>
    </div>
  );
};
