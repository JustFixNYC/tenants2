import i18n from "../i18n";

/**
 * Convert a Date to just the date part of its ISO representation,
 * e.g. '2018-09-15'.
 */
export function dateAsISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Convert a Date to just the date part of its ISO representation,
 * e.g. '2018-09-15'.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

/** Our preferred time zone, which we assume most/all users are in. */
export const PREFERRED_TIME_ZONE = "America/New_York";

/**
 * Return the given date formatted in a friendly way using the current
 * locale, like "Saturday, September 15, 2018". If the browser doesn't
 * have the `Intl` object, however, we'll return a less-friendly string like
 * "Sat Sep 15 2018".
 */
export function friendlyDate(
  date: Date,
  timeZone: string = PREFERRED_TIME_ZONE
) {
  const { locale } = i18n;
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(
      date
    );
  } catch (e) {
    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (e) {
      return date.toDateString();
    }
  }
}
