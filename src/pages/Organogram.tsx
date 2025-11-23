import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Network, Download, ZoomIn, ZoomOut } from "lucide-react";
import { OrgTree } from "@/components/organogram/OrgTree";
import { OrgFilters } from "@/components/organogram/OrgFilters";
import { toast } from "sonner";

interface OrgEntity {
  id: string;
  name: string;
  type: string;
  code?: string;
  parent_id: string | null;
  children?: OrgEntity[];
  employees?: Employee[];
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  job_title?: string | null;
  grade?: string | null;
  avatar_url?: string | null;
  unit_id?: string | null;
  manager_id?: string | null;
}

export default function Organogram() {
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<OrgEntity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [units, setUnits] = useState<Array<{ id: string; name: string }>>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'entities' | 'employees' | 'hybrid'>('hybrid');
  const [showPhotos, setShowPhotos] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar estrutura organizacional
      const { data: entitiesData, error: entitiesError } = await supabase
        .from('organizational_structure')
        .select('id, name, type, code, parent_id')
        .order('name');

      if (entitiesError) throw entitiesError;

      // Buscar colaboradores
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, job_title, grade, avatar_url, unit_id, manager_id')
        .eq('status', 'active')
        .order('full_name');

      if (employeesError) throw employeesError;

      setEmployees(employeesData || []);

      // Construir árvore hierárquica
      const tree = buildTree(entitiesData || [], employeesData || []);
      setEntities(tree);

      // Construir lista de unidades para filtro
      const unitsList = (entitiesData || [])
        .filter(e => ['area', 'department', 'sector', 'project'].includes(e.type))
        .map(e => ({ id: e.id, name: e.name }));
      setUnits(unitsList);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar organograma');
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (entities: any[], employees: any[]): OrgEntity[] => {
    const entityMap = new Map<string, OrgEntity>();
    
    // Criar mapa de entidades
    entities.forEach(entity => {
      entityMap.set(entity.id, {
        ...entity,
        children: [],
        employees: []
      });
    });

    // Adicionar colaboradores às suas unidades
    employees.forEach(employee => {
      if (employee.unit_id && entityMap.has(employee.unit_id)) {
        entityMap.get(employee.unit_id)!.employees!.push(employee);
      }
    });

    // Construir árvore
    const roots: OrgEntity[] = [];
    entityMap.forEach(entity => {
      if (entity.parent_id && entityMap.has(entity.parent_id)) {
        entityMap.get(entity.parent_id)!.children!.push(entity);
      } else {
        roots.push(entity);
      }
    });

    return roots;
  };

  const filterTree = (nodes: OrgEntity[]): OrgEntity[] => {
    if (!searchTerm && selectedUnit === 'all') return nodes;

    return nodes
      .map(node => {
        const matchesSearch = !searchTerm || 
          node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.employees?.some(e => 
            e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
          );

        const matchesUnit = selectedUnit === 'all' || node.id === selectedUnit;

        const filteredChildren = node.children ? filterTree(node.children) : [];
        const filteredEmployees = node.employees?.filter(e =>
          !searchTerm ||
          e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matchesSearch || matchesUnit || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
            employees: filteredEmployees
          };
        }

        return null;
      })
      .filter(Boolean) as OrgEntity[];
  };

  const handleExport = () => {
    toast.info('Funcionalidade de exportação será implementada em breve');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <Network className="w-12 h-12 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Carregando organograma...</p>
        </div>
      </div>
    );
  }

  const filteredData = filterTree(entities);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Organograma</h1>
            <p className="text-muted-foreground mt-1">
              Visualize a hierarquia e estrutura da empresa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">
            {zoom}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <OrgFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showPhotos={showPhotos}
        onShowPhotosChange={setShowPhotos}
        selectedUnit={selectedUnit}
        onUnitChange={setSelectedUnit}
        units={units}
      />

      {/* Organograma */}
      <div 
        className="bg-card border rounded-lg overflow-auto"
        style={{ 
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          minHeight: '500px'
        }}
      >
        <OrgTree
          data={filteredData}
          viewMode={viewMode}
          showPhotos={showPhotos}
        />
      </div>
    </div>
  );
}
