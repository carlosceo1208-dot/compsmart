import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AnalyticsFilters {
  name: string;
  unitIds: string[];
  jobTitleIds: string[];
  grades: string[];
  status: string[];
}

interface AnalyticsFiltersContextType {
  filters: AnalyticsFilters;
  setFilters: (filters: AnalyticsFilters) => void;
  updateFilter: <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => void;
  clearFilters: () => void;
}

const defaultFilters: AnalyticsFilters = {
  name: '',
  unitIds: [],
  jobTitleIds: [],
  grades: [],
  status: ['active'],
};

const AnalyticsFiltersContext = createContext<AnalyticsFiltersContextType | undefined>(undefined);

export const AnalyticsFiltersProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);

  const updateFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <AnalyticsFiltersContext.Provider value={{ filters, setFilters, updateFilter, clearFilters }}>
      {children}
    </AnalyticsFiltersContext.Provider>
  );
};

export const useAnalyticsFilters = () => {
  const context = useContext(AnalyticsFiltersContext);
  if (!context) {
    throw new Error('useAnalyticsFilters must be used within AnalyticsFiltersProvider');
  }
  return context;
};
