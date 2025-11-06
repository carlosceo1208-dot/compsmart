import { createContext, useContext, useState, ReactNode } from 'react';

interface BudgetFilters {
  fiscalYear: number;
  month: number | null;
  unitId: string | null;
}

interface BudgetFiltersContextType {
  filters: BudgetFilters;
  updateFilter: (key: keyof BudgetFilters, value: number | string | null) => void;
  clearFilters: () => void;
}

const BudgetFiltersContext = createContext<BudgetFiltersContextType | undefined>(undefined);

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export const BudgetFiltersProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<BudgetFilters>({
    fiscalYear: currentYear,
    month: currentMonth,
    unitId: null,
  });

  const updateFilter = (key: keyof BudgetFilters, value: number | string | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fiscalYear: currentYear,
      month: currentMonth,
      unitId: null,
    });
  };

  return (
    <BudgetFiltersContext.Provider value={{ filters, updateFilter, clearFilters }}>
      {children}
    </BudgetFiltersContext.Provider>
  );
};

export const useBudgetFilters = () => {
  const context = useContext(BudgetFiltersContext);
  if (!context) {
    throw new Error('useBudgetFilters must be used within BudgetFiltersProvider');
  }
  return context;
};
