import { cn } from "@/lib/utils";
import { useLogoUrl } from "@/hooks/useVagas";

/** Logo da empresa na vaga; sem logo, círculo com a inicial. */
export const EmpresaLogo = ({ path, nome, className }: { path: string | null | undefined; nome: string; className?: string }) => {
  const { data: url } = useLogoUrl(path);
  const base = cn("h-12 w-12 shrink-0 rounded-full border bg-card", className);
  if (url) return <img src={url} alt={`Logo ${nome}`} className={cn(base, "object-contain p-1")} loading="lazy" />;
  return (
    <div className={cn(base, "flex items-center justify-center bg-primary/10 text-primary font-semibold")} aria-hidden="true">
      {(nome.trim()[0] ?? "E").toUpperCase()}
    </div>
  );
};
