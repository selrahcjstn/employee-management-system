/** Splits a list into pieces of at most `size`, e.g. to keep an IN (...) list under the bind-parameter limit. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const pieces: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    pieces.push(items.slice(start, start + size));
  }
  return pieces;
}
