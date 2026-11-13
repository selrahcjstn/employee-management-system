const PESO = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
});
const DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * "33500.00" -> "₱33,500.00". The API sends money as a decimal string; the string goes straight to
 * Intl, which formats decimal strings exactly, so no amount ever passes through a float.
 * (TypeScript's lib only declares number and bigint for `format`, hence the cast.)
 */
export function formatPeso(amount: string): string {
  return PESO.format(amount as unknown as number);
}

/** "2023-01-16" -> "Jan 16, 2023". Read as a calendar date, so the viewer's timezone cannot shift the day. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return DATE.format(new Date(Date.UTC(year!, month! - 1, day)));
}
