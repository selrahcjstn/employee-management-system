/** "Juan D. Cruz": first name, middle initial (if any) and last name. */
export function formatEmployeeName(
  firstName: string,
  middleName: string | null,
  lastName: string,
): string {
  // Array.from walks code points, so a name starting with an astral character is not split in half.
  const initial = middleName
    ? `${Array.from(middleName)[0]!.toUpperCase()}.`
    : null;
  return [firstName, initial, lastName].filter(Boolean).join(' ');
}
