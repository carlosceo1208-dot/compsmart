import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";

interface OrgFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'entities' | 'employees' | 'hybrid';
  onViewModeChange: (value: 'entities' | 'employees' | 'hybrid') => void;
  showPhotos: boolean;
  onShowPhotosChange: (value: boolean) => void;
  selectedUnit: string;
  onUnitChange: (value: string) => void;
  units: Array<{ id: string; name: string }>;
}

export function OrgFilters({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showPhotos,
  onShowPhotosChange,
  selectedUnit,
  onUnitChange,
  units
}: OrgFiltersProps) {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Busca */}
        <div className="space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome, cargo ou unidade..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Modo de Visualização */}
        <div className="space-y-2">
          <Label>Modo de Visualização</Label>
          <Select value={viewMode} onValueChange={onViewModeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entities">📊 Apenas Estrutura</SelectItem>
              <SelectItem value="employees">👥 Apenas Colaboradores</SelectItem>
              <SelectItem value="hybrid">🔄 Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Unidade */}
        <div className="space-y-2">
          <Label>Filtrar por Unidade</Label>
          <Select value={selectedUnit} onValueChange={onUnitChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggle de Fotos */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="space-y-0.5">
          <Label>Mostrar Fotos</Label>
          <p className="text-xs text-muted-foreground">
            Exibir fotos dos colaboradores nos cards
          </p>
        </div>
        <Switch
          checked={showPhotos}
          onCheckedChange={onShowPhotosChange}
        />
      </div>
    </div>
  );
}
