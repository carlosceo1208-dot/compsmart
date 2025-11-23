import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AlertType = 
  | 'spike_queries'
  | 'recurring_errors'
  | 'inactive_users'
  | 'token_overconsumption'
  | 'after_hours_usage'
  | 'user_concentration';

export interface AlertConfig {
  id: string;
  root_company_id: string;
  alert_type: AlertType;
  threshold_value: number;
  threshold_unit: string | null;
  enabled: boolean;
  severity: 'info' | 'warning' | 'critical';
  check_frequency: 'hourly' | 'daily' | 'weekly';
  recipients: string[];
  created_at: string;
  updated_at: string;
}

export const useAlertConfigs = () => {
  return useQuery({
    queryKey: ['alert-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_configurations')
        .select('*')
        .order('alert_type');
      
      if (error) throw error;
      return data as AlertConfig[];
    }
  });
};

export const useUpdateAlertConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AlertConfig> }) => {
      const { data, error } = await supabase
        .from('alert_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configs'] });
      toast.success('Configuração atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating alert config:', error);
      toast.error('Erro ao atualizar configuração');
    }
  });
};

export const alertTypeLabels: Record<AlertType, { title: string; description: string; icon: string }> = {
  spike_queries: {
    title: 'Pico de Consultas',
    description: 'Detecta aumento anormal no número de consultas aos agentes',
    icon: '🚀'
  },
  recurring_errors: {
    title: 'Erros Recorrentes',
    description: 'Identifica consultas com problemas de performance ou erros',
    icon: '⚠️'
  },
  inactive_users: {
    title: 'Usuários Inativos',
    description: 'Encontra usuários que não utilizam os agentes há muito tempo',
    icon: '😴'
  },
  token_overconsumption: {
    title: 'Consumo de Tokens',
    description: 'Monitora consumo excessivo de tokens de IA',
    icon: '💰'
  },
  after_hours_usage: {
    title: 'Uso Fora do Horário',
    description: 'Detecta consultas em horários atípicos ou fins de semana',
    icon: '🌙'
  },
  user_concentration: {
    title: 'Concentração de Uso',
    description: 'Identifica quando um usuário domina o uso dos agentes',
    icon: '👤'
  }
};
