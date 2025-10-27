import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemLabel {
  key: string;
  default_label: string;
  custom_label: string | null;
  description: string | null;
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

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('system_labels')
        .select('key, default_label, custom_label');

      if (error) throw error;

      const labelsMap: Record<string, string> = {};
      data?.forEach((label: SystemLabel) => {
        labelsMap[label.key] = label.custom_label || label.default_label;
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
    try {
      const { error } = await supabase
        .from('system_labels')
        .update({ custom_label: customLabel })
        .eq('key', key);

      if (error) throw error;
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
