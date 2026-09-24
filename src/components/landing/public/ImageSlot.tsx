import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageSlotProps {
  /** Quando a imagem real for enviada, passe a URL aqui. */
  src?: string;
  alt: string;
  /** Rótulo interno do espaço reservado (ex.: "Imagem A"). */
  label: string;
  className?: string;
}

/** Moldura 16:9 — mostra a imagem real ou um espaço reservado neutro. */
export const ImageSlot = ({ src, alt, label, className }: ImageSlotProps) => (
  <div
    className={cn(
      "relative w-full aspect-video overflow-hidden rounded-2xl border border-border bg-muted/50",
      className,
    )}
  >
    {src ? (
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
    ) : (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/70"
        role="img"
        aria-label={alt}
        data-slot={label}
      >
        <ImageIcon className="h-8 w-8" />
      </div>
    )}
  </div>
);
