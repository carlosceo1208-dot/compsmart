import { toZonedTime, format } from 'date-fns-tz';

export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

/**
 * Returns the current date/time in São Paulo timezone
 */
export const getBrazilDate = (): Date => {
  return toZonedTime(new Date(), SAO_PAULO_TIMEZONE);
};

/**
 * Returns the current date as 'YYYY-MM-DD' string in São Paulo timezone
 */
export const getBrazilDateString = (): string => {
  return format(getBrazilDate(), 'yyyy-MM-dd');
};

/**
 * Converts a date string to a Date object considering São Paulo timezone (UTC-3)
 */
const getBrazilDateTime = (dateString: string): Date => {
  return new Date(`${dateString}T00:00:00-03:00`);
};
