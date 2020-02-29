type NiceTimestampOptions = Partial<{
  seconds: boolean,
}>;

export function niceAdminTimestamp(isoDate: string, options: NiceTimestampOptions = {}): string {
  const date = new Date(Date.parse(isoDate));
  const localeDate = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return options.seconds ? localeDate : localeDate.replace(/(\:\d\d) /, ' ');
}

export function friendlyAdminPhoneNumber(phoneNumber: string): string {
  const match = phoneNumber.match(/^(?:\+1)?(\d\d\d)(\d\d\d)(\d\d\d\d)$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phoneNumber;
}
