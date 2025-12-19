import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Building2, ChevronDown, ChevronUp, Loader2, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCompanyLocations } from "@/hooks/useCompanyLocations";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para ícones do Leaflet no React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Ícone personalizado para Matriz (azul)
const headquartersIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Ícone personalizado para Filial (verde)
const branchIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para ajustar o zoom automaticamente
const FitBounds = ({ locations }: { locations: { latitude: number; longitude: number }[] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 10);
    } else {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.latitude, loc.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
};

export const CompanyMapCard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { locations, allLocations, isLoading } = useCompanyLocations();

  // Contar unidades sem localização
  const missingLocations = allLocations.filter(
    loc => !loc.latitude || !loc.longitude
  ).length;

  // Centro padrão: Brasil
  const defaultCenter: [number, number] = [-15.7801, -47.9292];

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
                <div className="h-48 rounded-lg overflow-hidden border border-border/50">
                  <MapContainer
                    center={defaultCenter}
                    zoom={4}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    <FitBounds 
                      locations={locations.map(loc => ({
                        latitude: loc.latitude!,
                        longitude: loc.longitude!
                      }))} 
                    />

                    {locations.map((location) => (
                      <Marker
                        key={location.id}
                        position={[location.latitude!, location.longitude!]}
                        icon={location.type === "headquarters" ? headquartersIcon : branchIcon}
                      >
                        <Popup>
                          <div className="text-center min-w-[120px]">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Building2 className="h-3 w-3" />
                              <span className="font-semibold text-xs uppercase">
                                {location.type === "headquarters" ? "Matriz" : "Filial"}
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              {location.name}
                            </div>
                            {location.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {location.description}
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

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
