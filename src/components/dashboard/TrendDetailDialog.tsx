import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  Gift, 
  Home, 
  Cpu, 
  Users, 
  ExternalLink,
  Target,
  Lightbulb,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import type { CompensationTrend } from "@/hooks/useCompensationTrends";

interface TrendDetailDialogProps {
  trend: CompensationTrend | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  salários: { icon: TrendingUp, color: "text-green-500", label: "Salários" },
  benefícios: { icon: Gift, color: "text-purple-500", label: "Benefícios" },
  trabalho_remoto: { icon: Home, color: "text-blue-500", label: "Trabalho Remoto" },
  tecnologia: { icon: Cpu, color: "text-orange-500", label: "Tecnologia" },
  liderança: { icon: Users, color: "text-pink-500", label: "Liderança" },
};

export const TrendDetailDialog = ({ trend, open, onOpenChange }: TrendDetailDialogProps) => {
  if (!trend) return null;

  const config = categoryConfig[trend.category] || categoryConfig.salários;
  const CategoryIcon = config.icon;

  const handleSearchMore = () => {
    const searchTerms = trend.search_terms?.length 
      ? trend.search_terms.join(" ") 
      : `${trend.title} remuneração Brasil 2026`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerms)}`;
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
              <CategoryIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl leading-tight mb-2">
                {trend.title}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Fonte: {trend.source}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 pb-6 space-y-6">
            {/* Resumo */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {trend.summary}
              </p>
            </div>

            {/* Análise Detalhada */}
            {trend.detailed_analysis && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Análise Detalhada</h3>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {trend.detailed_analysis}
                </p>
              </div>
            )}

            {/* Impacto */}
            {trend.impact && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Impacto para sua Empresa</h3>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {trend.impact}
                </p>
              </div>
            )}

            {/* Recomendações */}
            {trend.recommendations && trend.recommendations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Recomendações Práticas</h3>
                </div>
                <Separator />
                <ul className="space-y-2">
                  {trend.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botão Pesquisar Mais */}
            <div className="pt-2">
              <Button 
                onClick={handleSearchMore}
                className="w-full"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Pesquisar mais sobre este tema
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
