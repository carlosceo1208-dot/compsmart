import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  CheckCircle2,
  Search,
  Globe,
  Briefcase,
  Newspaper,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import type { CompensationTrend } from "@/hooks/useCompensationTrends";

// Configuração das fontes de pesquisa
const searchSources = [
  {
    name: 'Google',
    icon: Globe,
    description: 'Pesquisa geral na web',
    buildUrl: (terms: string) => 
      `https://www.google.com/search?q=${encodeURIComponent(terms)}`,
  },
  {
    name: 'Glassdoor',
    icon: Search,
    description: 'Salários e avaliações',
    buildUrl: (terms: string) => 
      `https://www.glassdoor.com.br/Pesquisa/index.htm?keyword=${encodeURIComponent(terms)}`,
  },
  {
    name: 'LinkedIn',
    icon: Users,
    description: 'Artigos e tendências',
    buildUrl: (terms: string) => 
      `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(terms)}`,
  },
  {
    name: 'Indeed',
    icon: Briefcase,
    description: 'Comparativo de salários',
    buildUrl: (terms: string) => 
      `https://br.indeed.com/cmp/_/salaries?q=${encodeURIComponent(terms)}`,
  },
  {
    name: 'Exame',
    icon: Newspaper,
    description: 'Notícias de negócios',
    buildUrl: (terms: string) => 
      `https://exame.com/noticias-sobre/${encodeURIComponent(terms.replace(/ /g, '-'))}`,
  },
  {
    name: 'InfoMoney',
    icon: TrendingUp,
    description: 'Economia e mercado',
    buildUrl: (terms: string) => 
      `https://www.infomoney.com.br/busca/?s=${encodeURIComponent(terms)}`,
  },
];

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

  const getSearchTerms = () => {
    return trend.search_terms?.length 
      ? trend.search_terms.join(" ") 
      : `${trend.title} remuneração Brasil 2026`;
  };

  const openSearchSource = (source: typeof searchSources[0]) => {
    const searchTerms = getSearchTerms();
    const url = source.buildUrl(searchTerms);
    
    // Criar link temporário para evitar bloqueio de popup em iframes
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Abrindo pesquisa no ${source.name}...`);
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

            {/* Menu de Fontes de Pesquisa */}
            <div className="pt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisar mais sobre este tema
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Escolha a fonte de pesquisa
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {searchSources.map((source) => {
                    const SourceIcon = source.icon;
                    return (
                      <DropdownMenuItem
                        key={source.name}
                        onClick={() => openSearchSource(source)}
                        className="cursor-pointer"
                      >
                        <SourceIcon className="h-4 w-4 mr-2" />
                        <div className="flex-1">
                          <span className="font-medium">{source.name}</span>
                          <p className="text-xs text-muted-foreground">
                            {source.description}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
