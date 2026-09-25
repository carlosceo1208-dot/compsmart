import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SiteContent {
  id: string;
  section_key: string;
  section_name: string;
  content: Record<string, any>;
  is_active: boolean;
  updated_at: string;
}

const useSiteContentSection = (sectionKey: string) => {
  return useQuery({
    queryKey: ['site-content', sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('section_key', sectionKey)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.content as Record<string, any> | null;
    },
  });
};

export const useAllSiteContent = () => {
  return useQuery({
    queryKey: ['site-content-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('section_name');
      
      if (error) throw error;
      return data as SiteContent[];
    },
  });
};

export const useUpdateSiteContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: Record<string, any> }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('site_content')
        .update({ 
          content, 
          updated_by: user.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      queryClient.invalidateQueries({ queryKey: ['site-content-all'] });
      toast.success('Conteúdo atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar conteúdo');
    },
  });
};
