import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiBadgeProps {
  label?: string;
  className?: string;
  variant?: "default" | "subtle" | "solid";
}

/**
 * Badge sutil para sinalizar funcionalidades alimentadas por IA.
 * Usa tokens do design system (primary / accent) para manter coerência visual.
 */
export const AiBadge = ({ label = "IA", className, variant = "default" }: AiBadgeProps) => {
  const styles = {
    default:
      "bg-primary/10 text-primary border border-primary/20",
    subtle:
      "bg-muted text-muted-foreground border border-border",
    solid:
      "bg-gradient-to-r from-primary to-accent text-primary-foreground border border-transparent shadow-sm",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider leading-none transition-colors",
        styles,
        className
      )}
      aria-label="Alimentado por Inteligência Artificial"
    >
      <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
      {label}
    </span>
  );
};

export default AiBadge;
