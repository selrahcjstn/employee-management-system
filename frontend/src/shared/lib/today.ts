/** The business timezone: "today" for dates such as Date hired is the calendar date in Manila, as on the server. */
const BUSINESS_TIMEZONE = 'Asia/Manila';

/** Today's date as YYYY-MM-DD in Manila (the `en-CA` format is year-month-day). */
export function todayInManila(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
  });
}
