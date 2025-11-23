import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface KnowledgeFilters {
  search: string;
  agent_types: string[];
  categories: string[];
  is_global: boolean[];
  is_active: boolean[];
}

interface FilterSidebarProps {
  filters: KnowledgeFilters;
  onFiltersChange: (filters: KnowledgeFilters) => void;
  categories: string[];
}

export function FilterSidebar({ filters, onFiltersChange, categories }: FilterSidebarProps) {
  const toggleAgentType = (type: string) => {
    const current = filters.agent_types;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, agent_types: updated });
  };

  const toggleCategory = (category: string) => {
    const current = filters.categories;
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    onFiltersChange({ ...filters, categories: updated });
  };

  const toggleGlobal = (isGlobal: boolean) => {
    const current = filters.is_global;
    const updated = current.includes(isGlobal)
      ? current.filter(g => g !== isGlobal)
      : [...current, isGlobal];
    onFiltersChange({ ...filters, is_global: updated });
  };

  const toggleActive = (isActive: boolean) => {
    const current = filters.is_active;
    const updated = current.includes(isActive)
      ? current.filter(a => a !== isActive)
      : [...current, isActive];
    onFiltersChange({ ...filters, is_active: updated });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      agent_types: [],
      categories: [],
      is_global: [],
      is_active: []
    });
  };

  const activeFiltersCount = 
    filters.agent_types.length +
    filters.categories.length +
    filters.is_global.length +
    filters.is_active.length;

  return (
    <Card className="h-fit sticky top-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {activeFiltersCount > 0 && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
            <Separator />
          </>
        )}

        {/* Agentes */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Tipo de Agente</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agent-legal"
                checked={filters.agent_types.includes('legal')}
                onCheckedChange={() => toggleAgentType('legal')}
              />
              <label
                htmlFor="agent-legal"
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Jurídico
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agent-incentive"
                checked={filters.agent_types.includes('incentive')}
                onCheckedChange={() => toggleAgentType('incentive')}
              />
              <label
                htmlFor="agent-incentive"
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remuneração & Benefícios
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agent-both"
                checked={filters.agent_types.includes('both')}
                onCheckedChange={() => toggleAgentType('both')}
              />
              <label
                htmlFor="agent-both"
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ambos
              </label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Categorias */}
        {categories.length > 0 && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Categorias</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {categories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <label
                      htmlFor={`cat-${category}`}
                      className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Visibilidade */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Visibilidade</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="global-true"
                checked={filters.is_global.includes(true)}
                onCheckedChange={() => toggleGlobal(true)}
              />
              <label
                htmlFor="global-true"
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Global (todas empresas)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="global-false"
                checked={filters.is_global.includes(false)}
                onCheckedChange={() => toggleGlobal(false)}
              />
              <label
                htmlFor="global-false"
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Específico da Empresa
              </label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Status */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Status</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active-true"
                checked={filters.is_active.includes(true)}
                onCheckedChange={() => toggleActive(true)}
              />
              <label
                htmlFor="active-true"
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ativos
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active-false"
                checked={filters.is_active.includes(false)}
                onCheckedChange={() => toggleActive(false)}
              />
              <label
                htmlFor="active-false"
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Inativos
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
