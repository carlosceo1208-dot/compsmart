import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemLabel {
  key: string;
  default_label: string;
  custom_label: string | null;
  description: string | null;
  root_company_id: string | null;
}

interface LabelsContextType {
  labels: Record<string, string>;
  getLabel: (key: string) => string;
  updateLabel: (key: string, customLabel: string | null) => Promise<void>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const LabelsContext = createContext<LabelsContextType | undefined>(undefined);

export const LabelsProvider = ({ children }: { children: ReactNode }) => {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserCompany();
  }, []);

  useEffect(() => {
    if (userCompanyId !== null) {
      fetchLabels();
    }
  }, [userCompanyId]);

  const fetchUserCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('root_company_id')
          .eq('id', user.id)
          .single();
        
        setUserCompanyId(profile?.root_company_id || null);
      } else {
        // Usuário não logado - usar apenas templates globais
        setUserCompanyId('');
        fetchLabels();
      }
    } catch (error) {
      console.error('Error fetching user company:', error);
      setUserCompanyId('');
    }
  };

  const fetchLabels = async () => {
    try {
      // Buscar labels: templates globais (root_company_id = NULL) e da empresa
      const { data, error } = await supabase
        .from('system_labels')
        .select('key, default_label, custom_label, root_company_id');

      if (error) throw error;

      const labelsMap: Record<string, string> = {};
      
      // Primeiro, aplicar templates globais
      data?.filter(l => l.root_company_id === null).forEach((label: SystemLabel) => {
        labelsMap[label.key] = label.custom_label || label.default_label;
      });

      // Depois, sobrescrever com labels da empresa (se existirem)
      data?.filter(l => l.root_company_id !== null).forEach((label: SystemLabel) => {
        if (label.custom_label) {
          labelsMap[label.key] = label.custom_label;
        }
      });

      setLabels(labelsMap);
    } catch (error) {
      console.error('Error fetching labels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (key: string): string => {
    return labels[key] || key;
  };

  const updateLabel = async (key: string, customLabel: string | null) => {
    if (!userCompanyId) {
      throw new Error('Empresa não identificada');
    }

    try {
      // Verificar se já existe um registro para esta empresa e chave
      const { data: existing } = await supabase
        .from('system_labels')
        .select('id')
        .eq('key', key)
        .eq('root_company_id', userCompanyId)
        .single();

      if (existing) {
        // Atualizar registro existente da empresa
        const { error } = await supabase
          .from('system_labels')
          .update({ custom_label: customLabel })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Buscar o template global para obter default_label
        const { data: globalTemplate } = await supabase
          .from('system_labels')
          .select('default_label, description')
          .eq('key', key)
          .is('root_company_id', null)
          .single();

        // Criar novo registro para a empresa
        const { error } = await supabase
          .from('system_labels')
          .insert({
            key,
            default_label: globalTemplate?.default_label || key,
            custom_label: customLabel,
            description: globalTemplate?.description,
            root_company_id: userCompanyId
          });

        if (error) throw error;
      }

      await fetchLabels();
    } catch (error) {
      console.error('Error updating label:', error);
      throw error;
    }
  };

  return (
    <LabelsContext.Provider value={{ labels, getLabel, updateLabel, loading, refresh: fetchLabels }}>
      {children}
    </LabelsContext.Provider>
  );
};

export const useLabels = () => {
  const context = useContext(LabelsContext);
  if (!context) {
    throw new Error('useLabels must be used within LabelsProvider');
  }
  return context;
};
