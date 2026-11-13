import { ConflictException, HttpStatus } from '@nestjs/common';

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

export interface MappedDbError {
  status: number;
  message: string;
}

const NODE_CONNECTION_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
]);

/**
 * The safety net behind the services' own friendly messages: turns a database error into
 * the right 4xx/503 instead of a 500. Messages are generic, so no constraint, table or value leaks.
 * Returns undefined for anything that is really an unexpected server error.
 */
export function mapDbError(error: unknown): MappedDbError | undefined {
  const state = sqlState(error);
  if (!state) return undefined;
  if (state === '23505') {
    return { status: HttpStatus.CONFLICT, message: 'Resource already exists' };
  }
  if (state === '23503') {
    return {
      status: HttpStatus.CONFLICT,
      message: 'Operation conflicts with related records',
    };
  }
  if (state === '40001' || state === '40P01') {
    return {
      status: HttpStatus.CONFLICT,
      message: 'Request conflicted with another one, please retry',
    };
  }
  if (state === '23502' || state === '23514' || state.startsWith('22')) {
    return {
      status: HttpStatus.BAD_REQUEST,
      message: 'Invalid value in request',
    };
  }
  if (
    state.startsWith('08') ||
    state === '57P01' ||
    state === '57P03' ||
    state === '53300' ||
    NODE_CONNECTION_CODES.has(state)
  ) {
    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Service temporarily unavailable',
    };
  }
  return undefined;
}
