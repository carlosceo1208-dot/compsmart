import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useConsultorCoreAccess } from '@/hooks/useRhService';
import type { ColumnMapping } from '@/lib/employeeImport/fieldCatalog';
import type { ImportLookups, ValidatedRow } from '@/lib/employeeImport/validateRows';

export interface ImportRun {
  id: string;
  file_name: string;
  sheet_name: string | null;
  source_system: string | null;
  duplicate_strategy: string;
  mapping: ColumnMapping;
  total_rows: number;
  imported_count: number;
  updated_count: number;
  ignored_count: number;
  error_count: number;
  status: string;
  created_at: string;
}

export interface ImportRowError {
  id: string;
  row_number: number;
  error_type: string;
  field: string | null;
  message: string;
  row_data: Record<string, unknown>;
}

export interface ImportChange {
  id: string;
  profile_id: string | null;
  row_number: number | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
}

export interface SavedMapping {
  id: string;
  name: string;
  source_system: string | null;
  mapping: ColumnMapping;
  usage_count: number;
  created_at: string;
}

export type DuplicateStrategy = 'update' | 'ignore' | 'only_new';

/** Quem pode importar: admin, RH, consultor CompSmart e super admin */
export const useEmployeeImportAccess = () => {
  const { data: roleData, isLoading } = useCurrentUserRole();
  const { isConsultor, hasCoreAccess, loading: consultorLoading } = useConsultorCoreAccess();

  const canImport =
    !!roleData?.isSuperAdmin ||
    !!roleData?.isAdmin ||
    !!roleData?.isHR ||
    (isConsultor && hasCoreAccess);

  return { canImport, loading: isLoading || consultorLoading };
};


export const useImportLookups = (enabled: boolean) => {
  const { activeCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['employee-import-lookups', activeCompanyId],
    enabled: enabled && !!activeCompanyId,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<ImportLookups> => {
      const [jobs, units, people] = await Promise.all([
        supabase.from('job_titles').select('id, title, code, grade'),
        supabase.from('organizational_structure').select('id, code, name'),
        supabase.from('profiles').select('id, email, employee_number, cpf'),
      ]);

      if (jobs.error) throw jobs.error;
      if (units.error) throw units.error;
      if (people.error) throw people.error;

      return {
        jobTitles: jobs.data ?? [],
        units: (units.data ?? []).map((u) => ({ id: u.id, code: u.code ?? null, name: u.name ?? null })),
        managers: (people.data ?? []).map((p) => ({ id: p.id, email: p.email ?? null })),
        existingEmployeeNumbers: new Set(
          (people.data ?? []).map((p) => p.employee_number ?? '').filter(Boolean),
        ),
        existingCpfs: new Set(
          (people.data ?? []).map((p) => (p.cpf ?? '').replace(/\D/g, '')).filter(Boolean),
        ),
      };
    },
  });
};

export const useImportHistory = (enabled = true) => {
  const { activeCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['employee-import-runs', activeCompanyId],
    enabled: enabled && !!activeCompanyId,
    queryFn: async (): Promise<ImportRun[]> => {
      const { data, error } = await supabase
        .from('employee_import_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as ImportRun[];
    },
  });
};

export const useImportRunDetail = (runId: string | null) => {
  return useQuery({
    queryKey: ['employee-import-run-detail', runId],
    enabled: !!runId,
    queryFn: async () => {
      const [errors, changes] = await Promise.all([
        supabase
          .from('employee_import_row_errors')
          .select('*')
          .eq('run_id', runId as string)
          .order('row_number', { ascending: true }),
        supabase
          .from('employee_import_changes')
          .select('*')
          .eq('run_id', runId as string)
          .order('row_number', { ascending: true }),
      ]);
      if (errors.error) throw errors.error;
      if (changes.error) throw changes.error;
      return {
        errors: (errors.data ?? []) as unknown as ImportRowError[],
        changes: (changes.data ?? []) as unknown as ImportChange[],
      };
    },
  });
};

export const useSavedMappings = (enabled = true) => {
  const { activeCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['employee-import-mappings', activeCompanyId],
    enabled: enabled && !!activeCompanyId,
    queryFn: async (): Promise<SavedMapping[]> => {
      const { data, error } = await supabase
        .from('employee_import_mappings')
        .select('*')
        .order('usage_count', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SavedMapping[];
    },
  });
};

export const useSaveMapping = () => {
  const queryClient = useQueryClient();
  const { activeCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (payload: { name: string; sourceSystem: string | null; mapping: ColumnMapping }) => {
      if (!activeCompanyId) throw new Error('Empresa não identificada.');
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('employee_import_mappings').upsert(
        {
          tenant_id: activeCompanyId,
          name: payload.name,
          source_system: payload.sourceSystem,
          mapping: payload.mapping as never,
          created_by: userData.user?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,name' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-import-mappings'] });
    },
  });
};

export interface RunImportPayload {
  fileName: string;
  sheetName: string | null;
  sourceSystem: string | null;
  strategy: DuplicateStrategy;
  mapping: ColumnMapping;
  rows: ValidatedRow[];
}

export interface ImportResultSummary {
  run_id: string;
  imported: number;
  updated: number;
  ignored: number;
  errors: number;
  total: number;
}

export const useRunImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RunImportPayload): Promise<ImportResultSummary> => {
      const validRows = payload.rows.filter((row) => row.valid);
      const invalidRows = payload.rows.filter((row) => !row.valid);

      const { data, error } = await supabase.rpc('import_employees_batch', {
        p_run: {
          file_name: payload.fileName,
          sheet_name: payload.sheetName,
          source_system: payload.sourceSystem,
          duplicate_strategy: payload.strategy,
          mapping: payload.mapping,
          total_rows: payload.rows.length,
          validation_errors: invalidRows.flatMap((row) =>
            row.issues
              .filter((issue) => issue.severity === 'error')
              .map((issue) => ({
                row_number: row.rowNumber,
                error_type: 'validacao',
                field: issue.field ?? null,
                message: issue.message,
                row_data: row.raw,
              })),
          ),
        } as never,
        p_rows: validRows.map((row) => ({
          row_number: row.rowNumber,
          fields: row.fields,
        })) as never,
      });

      if (error) throw error;
      return data as unknown as ImportResultSummary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-import-runs'] });
    },
  });
};
