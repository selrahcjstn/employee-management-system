import type { Employee } from './types';

/** IDs of the form EMP-123: the number after the hyphen is what the suggestion counts up from. */
const NUMBERED = /^EMP-(\d+)$/i;

/**
 * The next Employee ID to suggest: the highest EMP-<number> in the list plus one, with the number
 * padded to at least 3 digits (EMP-004 gives EMP-005; EMP-999 gives EMP-1000). IDs of any other
 * shape (EMP001, STAFF-7) are ignored. With no EMP-<number> ID at all it suggests nothing, so the
 * field starts empty.
 */
export function suggestEmployeeNo(
  employees: readonly Pick<Employee, 'employeeNo'>[],
): string {
  let highest: bigint | null = null;
  for (const { employeeNo } of employees) {
    const match = NUMBERED.exec(employeeNo.trim());
    if (!match) continue;
    const value = BigInt(match[1]!);
    if (highest === null || value > highest) highest = value;
  }
  return highest === null ? '' : `EMP-${String(highest + 1n).padStart(3, '0')}`;
}
