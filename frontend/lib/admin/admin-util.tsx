import { PREFERRED_TIME_ZONE } from "../util/date-util";

type NiceTimestampOptions = Partial<{
  /** Show the number of seconds into the minute. */
  seconds: boolean;
}>;

/**
 * Convert an ISO date string into a more readable one.
 *
 * Note that this requires newer browsers which support more built-in localization
 * functionality, which is why this function is currently intended for use in
 * admin interfaces only.
 */
export function niceAdminTimestamp(
  isoDate: string,
  options: NiceTimestampOptions = {}
): string {
  const date = new Date(Date.parse(isoDate));
  const localeDate = date.toLocaleString("en-US", {
    timeZone: PREFERRED_TIME_ZONE,
  });
  return options.seconds ? localeDate : localeDate.replace(/(\:\d\d) /, " ");
}
