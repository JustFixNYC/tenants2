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
 *
 * If `options.yearAndMonthOnly` is true, then the given date will
 * be formatted with only the month and year, e.g. "September 2018".
 */
export function friendlyDate(
  date: Date,
  timeZone: string = PREFERRED_TIME_ZONE,
  options: { yearAndMonthOnly?: boolean } = {}
) {
  const { locale } = i18n;
  let intlOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
  };
  if (!options.yearAndMonthOnly) {
    intlOptions = {
      ...intlOptions,
      weekday: "long",
      day: "numeric",
    };
  }
  try {
    return new Intl.DateTimeFormat(locale, { ...intlOptions, timeZone }).format(
      date
    );
  } catch (e) {
    try {
      return new Intl.DateTimeFormat(locale, intlOptions).format(date);
    } catch (e) {
      return date.toDateString();
    }
  }
}

/**
 * Like `friendlyDate()` but takes an ISO 8601-formatted date like "2020-03-13"
 * and forces the time zone to UTC.
 *
 * This is useful because such dates are interpreted to be in midnight UTC time,
 * and we want to *not* convert it to any other time zone, otherwise it may
 * appear as a different date.
 */
export function friendlyUTCDate(date: GraphQLDate) {
  return friendlyDate(new Date(date), "UTC");
}

/**
 * Returns the month and year of the given ISO 8601-formatted date.
 * For example, passing in "2020-03-13" would return "March 2020".
 */
export function friendlyUTCMonthAndYear(date: GraphQLDate) {
  return friendlyDate(new Date(date), "UTC", {
    yearAndMonthOnly: true,
  });
}
