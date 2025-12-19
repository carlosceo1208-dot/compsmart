import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Building2, ChevronDown, ChevronUp, Loader2, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCompanyLocations } from "@/hooks/useCompanyLocations";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para ícones do Leaflet
const headquartersIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const branchIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const CompanyMapCard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { locations, allLocations, isLoading } = useCompanyLocations();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Contar unidades sem localização
  const missingLocations = allLocations.filter(
    loc => !loc.latitude || !loc.longitude
  ).length;

  // Inicializar mapa com Leaflet puro (sem react-leaflet)
  useEffect(() => {
    if (!mapContainerRef.current || isLoading || locations.length === 0) return;
    
    // Destruir mapa existente se houver
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Criar novo mapa
    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true
    });

    mapRef.current = map;

    // Adicionar tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Adicionar marcadores
    const markers: L.Marker[] = [];
    
    locations.forEach((location) => {
      if (location.latitude && location.longitude) {
        const icon = location.type === "headquarters" ? headquartersIcon : branchIcon;
        const typeLabel = location.type === "headquarters" ? "MATRIZ" : "FILIAL";
        
        const marker = L.marker([location.latitude, location.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="text-align: center; min-width: 120px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 4px;">
                <span style="font-weight: 600; font-size: 11px; text-transform: uppercase;">
                  ${typeLabel}
                </span>
              </div>
              <div style="font-size: 13px; font-weight: 500;">
                ${location.name}
              </div>
              ${location.description ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">${location.description}</div>` : ''}
            </div>
          `);
        
        markers.push(marker);
      }
    });

    // Ajustar zoom para mostrar todos os marcadores
    if (markers.length === 1 && locations[0].latitude && locations[0].longitude) {
      map.setView([locations[0].latitude, locations[0].longitude], 10);
    } else if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [30, 30] });
    } else {
      // Centro padrão: Brasil
      map.setView([-15.7801, -47.9292], 4);
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locations, isLoading]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Localização das Unidades
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs">Carregando mapa...</span>
                </div>
              </div>
            ) : locations.length === 0 ? (
              <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <MapPinOff className="h-8 w-8" />
                  <span className="text-xs text-center px-4">
                    Nenhuma unidade com endereço cadastrado.
                    <br />
                    Cadastre o endereço em Organização.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div 
                  ref={mapContainerRef}
                  className="h-48 rounded-lg overflow-hidden border border-border/50"
                  style={{ zIndex: 0 }}
                />

                {/* Legenda */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Matriz</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Filial</span>
                    </div>
                  </div>
                  <span>{locations.length} unidade(s)</span>
                </div>

                {missingLocations > 0 && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <MapPinOff className="h-3 w-3" />
                    {missingLocations} unidade(s) sem endereço
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
