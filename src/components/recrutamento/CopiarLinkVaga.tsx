import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { linkPublicoVaga } from "@/config/recrutamento";

/** Copia o link público da vaga em 1 clique (divulgação pelo RH). */
export const CopiarLinkVaga = ({ slug, compact }: { slug: string; compact?: boolean }) => {
  const copiar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = linkPublicoVaga(slug);
    try { await navigator.clipboard.writeText(url); toast.success("Link copiado"); }
    catch { toast.info(url, { description: "Copie o link acima." }); }
  };
  return (
    <Button type="button" variant="outline" size={compact ? "sm" : "default"} className="rounded-xl" onClick={copiar}
      onKeyDown={(e) => e.stopPropagation()} aria-label="Copiar link público da vaga">
      <Link2 className="h-4 w-4 mr-1.5" />Copiar link
    </Button>
  );
};
