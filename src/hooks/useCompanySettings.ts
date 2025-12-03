import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanySettings {
  socialChargesPercentage: number;
}

export const useCompanySettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async (): Promise<CompanySettings> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.root_company_id) {
        return { socialChargesPercentage: 0 };
      }

      const { data, error } = await supabase
        .from('organizational_structure')
        .select('social_charges_percentage')
        .eq('id', profile.root_company_id)
        .single();

      if (error) throw error;

      return {
        socialChargesPercentage: data?.social_charges_percentage ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const updateSocialCharges = useMutation({
    mutationFn: async (percentage: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.root_company_id) {
        throw new Error('Empresa não encontrada');
      }

      const { error } = await supabase
        .from('organizational_structure')
        .update({ social_charges_percentage: percentage })
        .eq('id', profile.root_company_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('Encargos sociais atualizados!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar encargos:', error);
      toast.error('Erro ao salvar encargos sociais');
    },
  });

  return {
    socialChargesPercentage: settings?.socialChargesPercentage ?? 0,
    isLoading,
    updateSocialCharges: updateSocialCharges.mutate,
    isUpdating: updateSocialCharges.isPending,
  };
};