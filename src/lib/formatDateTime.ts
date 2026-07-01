// Shared pt-BR date/time formatting with a fixed timezone so fallback
// banners and cache timestamps look identical for every user, regardless
// of the browser's local timezone.

export const APP_TIMEZONE = "America/Sao_Paulo";
export const APP_LOCALE = "pt-BR";

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Formats an epoch/ISO/Date value as `dd/MM/yyyy HH:mm` in America/Sao_Paulo. */
export function formatDateTimePtBR(value: number | string | Date | null | undefined): string {
  if (value === null || value === undefined) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  // Intl output uses a comma between date and time in pt-BR — normalize to a space.
  return dateTimeFormatter.format(date).replace(", ", " ");
}
