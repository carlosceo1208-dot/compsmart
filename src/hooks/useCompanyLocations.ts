import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CompanyLocation {
  id: string;
  name: string;
  type: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
}

interface GeocodedLocation extends CompanyLocation {
  geocoded: boolean;
}

// Função para geocodificar endereço usando Nominatim (OpenStreetMap)
const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
  try {
    // Adiciona "Brasil" ao endereço para melhor precisão
    const searchAddress = address.includes("Brasil") ? address : `${address}, Brasil`;
    const encodedAddress = encodeURIComponent(searchAddress);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'CompSmart/1.0 (https://compsmart.com.br)'
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao geocodificar endereço:", error);
    return null;
  }
};

// Delay para respeitar rate limit do Nominatim (1 req/segundo)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useCompanyLocations = () => {
  const queryClient = useQueryClient();

  // Buscar unidades da empresa atual
  const { data: locations, isLoading, error } = useQuery({
    queryKey: ["company-locations"],
    queryFn: async () => {
      // Buscar unidades do tipo headquarters e branch da empresa do usuário
      const { data, error } = await supabase
        .from("organizational_structure")
        .select("id, name, type, address, latitude, longitude, description")
        .in("type", ["headquarters", "branch"])
        .order("type", { ascending: true });

      if (error) throw error;
      return data as CompanyLocation[];
    }
  });

  // Mutation para atualizar coordenadas no banco
  const updateCoordinates = useMutation({
    mutationFn: async ({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) => {
      const { error } = await supabase
        .from("organizational_structure")
        .update({ latitude, longitude })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-locations"] });
    }
  });

  // Função para geocodificar unidades sem coordenadas
  const geocodeLocations = async (locs: CompanyLocation[]): Promise<GeocodedLocation[]> => {
    const geocodedLocations: GeocodedLocation[] = [];

    for (const loc of locs) {
      // Se já tem coordenadas, usa as existentes
      if (loc.latitude && loc.longitude) {
        geocodedLocations.push({ ...loc, geocoded: true });
        continue;
      }

      // Tenta geocodificar pelo endereço
      if (loc.address) {
        const coords = await geocodeAddress(loc.address);
        
        if (coords) {
          // Salva as coordenadas no banco para cache
          await updateCoordinates.mutateAsync({
            id: loc.id,
            latitude: coords.lat,
            longitude: coords.lon
          });
          
          geocodedLocations.push({
            ...loc,
            latitude: coords.lat,
            longitude: coords.lon,
            geocoded: true
          });
          
          // Respeita rate limit do Nominatim
          await delay(1100);
          continue;
        }
      }

      // Fallback: tenta usar a descrição (ex: "SP - São Paulo")
      if (loc.description) {
        const coords = await geocodeAddress(loc.description);
        
        if (coords) {
          await updateCoordinates.mutateAsync({
            id: loc.id,
            latitude: coords.lat,
            longitude: coords.lon
          });
          
          geocodedLocations.push({
            ...loc,
            latitude: coords.lat,
            longitude: coords.lon,
            geocoded: true
          });
          
          await delay(1100);
          continue;
        }
      }

      // Não conseguiu geocodificar
      geocodedLocations.push({ ...loc, geocoded: false });
    }

    return geocodedLocations;
  };

  // Query para geocodificar localizações
  const { 
    data: geocodedLocations, 
    isLoading: isGeocoding,
    refetch: refetchGeocode
  } = useQuery({
    queryKey: ["company-locations-geocoded", locations],
    queryFn: () => geocodeLocations(locations || []),
    enabled: !!locations && locations.length > 0,
    staleTime: Infinity, // Cache permanente até invalidar
    gcTime: 1000 * 60 * 60 // 1 hora
  });

  // Filtrar apenas localizações com coordenadas válidas
  const validLocations = geocodedLocations?.filter(
    loc => loc.latitude && loc.longitude
  ) || [];

  return {
    locations: validLocations,
    allLocations: geocodedLocations || [],
    isLoading: isLoading || isGeocoding,
    error,
    refetch: refetchGeocode
  };
};
