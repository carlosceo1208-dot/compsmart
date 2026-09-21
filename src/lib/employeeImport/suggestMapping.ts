import { supabase } from '@/integrations/supabase/client';
import { IMPORT_FIELDS, normalizeHeader, type ColumnMapping } from './fieldCatalog';

const emptyMapping = (): ColumnMapping => {
  const mapping: ColumnMapping = {};
  IMPORT_FIELDS.forEach((field) => {
    mapping[field.key] = null;
  });
  return mapping;
};

const score = (header: string, synonym: string): number => {
  if (header === synonym) return 100;
  if (header.startsWith(synonym) || synonym.startsWith(header)) return 80;
  if (header.includes(synonym)) return 60;
  return 0;
};

/** Sugestão local, por dicionário de cabeçalhos comuns das folhas de pagamento */
export const suggestMappingLocal = (headers: string[]): ColumnMapping => {
  const mapping = emptyMapping();
  const used = new Set<string>();
  const normalized = headers.map((header) => ({ header, norm: normalizeHeader(header) }));

  IMPORT_FIELDS.forEach((field) => {
    let best: { header: string; value: number } | null = null;
    normalized.forEach(({ header, norm }) => {
      if (used.has(header)) return;
      const value = Math.max(...field.synonyms.map((s) => score(norm, normalizeHeader(s))));
      if (value > 0 && (!best || value > best.value)) best = { header, value };
    });
    if (best && best.value >= 60) {
      mapping[field.key] = best.header;
      used.add(best.header);
    }
  });

  return mapping;
};

/**
 * Sugestão assistida por IA para cabeçalhos que a heurística não resolveu.
 * Envia apenas os nomes das colunas (nenhum dado pessoal). Em caso de falha,
 * mantém silenciosamente a sugestão local.
 */
export const suggestMappingWithAI = async (
  headers: string[],
  baseMapping: ColumnMapping,
): Promise<{ mapping: ColumnMapping; aiUsed: boolean }> => {
  const mapped = new Set(Object.values(baseMapping).filter(Boolean) as string[]);
  const unmappedFields = IMPORT_FIELDS.filter((f) => !baseMapping[f.key]).map((f) => ({
    key: f.key,
    label: f.label,
  }));
  const unmappedHeaders = headers.filter((h) => !mapped.has(h));

  if (unmappedFields.length === 0 || unmappedHeaders.length === 0) {
    return { mapping: baseMapping, aiUsed: false };
  }

  try {
    const { data, error } = await supabase.functions.invoke('suggest-import-mapping', {
      body: { headers: unmappedHeaders, fields: unmappedFields },
    });
    if (error) throw error;

    const suggestions = (data?.mapping ?? {}) as Record<string, string | null>;
    const result: ColumnMapping = { ...baseMapping };
    let aiUsed = false;
    Object.entries(suggestions).forEach(([fieldKey, header]) => {
      if (!header) return;
      if (result[fieldKey]) return;
      if (!unmappedHeaders.includes(header)) return;
      if (Object.values(result).includes(header)) return;
      result[fieldKey] = header;
      aiUsed = true;
    });
    return { mapping: result, aiUsed };
  } catch {
    return { mapping: baseMapping, aiUsed: false };
  }
};
