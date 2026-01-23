/**
 * Utilitários de data (timezone-safe)
 *
 * IMPORTANTE: quando a data vem do backend como string "YYYY-MM-DD" (tipo DATE),
 * usar `new Date()` pode causar shift de fuso (ex.: 2026-01-01 virar 31/12/2025).
 * Estes helpers evitam esse problema formatando por parsing de string.
 */

/**
 * Converte "YYYY-MM-DD" -> "DD/MM/YYYY" sem usar Date().
 */
export const formatDateBRFromISODate = (value: string | null | undefined): string => {
  if (!value) return '-';

  // Aceita exatamente YYYY-MM-DD
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (!m) return value;

  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
};
