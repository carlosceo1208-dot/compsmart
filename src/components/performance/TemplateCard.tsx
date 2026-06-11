import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, FileText, Scale } from "lucide-react";
import { 
  usePerformanceTemplates, 
  templateTypeLabels,
  type PerformanceTemplate
} from "@/hooks/usePerformanceTemplates";

interface TemplateCardProps {
  template: PerformanceTemplate;
  onEdit: () => void;
}

const templateTypeColors: Record<string, string> = {
  standard: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  leadership: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  sales: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  technical: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  operational: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  administrative: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

export function TemplateCard({ template, onEdit }: TemplateCardProps) {
  const { deleteTemplate, parseIndicators } = usePerformanceTemplates();
  const indicators = parseIndicators(template.indicators);

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir este modelo?")) {
      await deleteTemplate.mutateAsync(template.id);
    }
  };

  const totalWeight = indicators.reduce((sum, ind) => sum + (ind.weight || 0), 0);

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <Badge 
                variant="outline" 
                className={templateTypeColors[template.template_type] || templateTypeColors.standard}
              >
                {templateTypeLabels[template.template_type] || template.template_type}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {template.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>
        )}

        {indicators.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Scale className="h-3 w-3" />
              {indicators.length} indicador{indicators.length > 1 ? "es" : ""}
            </div>
            <div className="space-y-1">
              {indicators.slice(0, 3).map((ind) => (
                <div key={ind.id} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1">{ind.name}</span>
                  <span className="text-muted-foreground ml-2">{ind.weight}%</span>
                </div>
              ))}
              {indicators.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{indicators.length - 3} mais...
                </div>
              )}
            </div>
            <div className="text-xs text-right">
              <span className={totalWeight === 100 ? "text-green-600" : "text-amber-600"}>
                Total: {totalWeight}%
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Sem indicadores definidos
          </p>
        )}

        {template.is_global && (
          <Badge variant="secondary" className="mt-2 text-xs">
            Modelo Global
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
