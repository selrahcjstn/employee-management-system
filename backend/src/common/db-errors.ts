import { ConflictException } from '@nestjs/common';

const UNIQUE_VIOLATION = '23505';

export function sqlState(error: unknown): string | undefined {
  for (
    let current = error;
    current && typeof current === 'object';
    current = (current as { cause?: unknown }).cause
  ) {
    const state =
      (current as { sqlState?: unknown; code?: unknown }).sqlState ??
      (current as { code?: unknown }).code;
    if (typeof state === 'string') return state;
  }
  return undefined;
}

export function isUniqueViolation(error: unknown): boolean {
  return sqlState(error) === UNIQUE_VIOLATION;
}

/** Maps a database unique violation to 409; rethrows anything else untouched. */
export function conflictOnUnique(error: unknown, message: string): never {
  if (isUniqueViolation(error)) throw new ConflictException(message);
  throw error;
}
