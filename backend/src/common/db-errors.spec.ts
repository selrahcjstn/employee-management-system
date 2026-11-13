import { mapDbError, sqlState } from './db-errors.js';

const withState = (sqlStateValue: string) => ({ sqlState: sqlStateValue });

describe('mapDbError', () => {
  it.each([
    ['unique violation', '23505', 409],
    ['foreign key violation', '23503', 409],
    ['serialization failure', '40001', 409],
    ['deadlock', '40P01', 409],
    ['not null violation', '23502', 400],
    ['check violation', '23514', 400],
    ['invalid byte sequence (NUL)', '22021', 400],
    ['numeric out of range', '22003', 400],
    ['value too long', '22001', 400],
    ['invalid text representation', '22P02', 400],
    ['connection failure', '08006', 503],
    ['admin shutdown', '57P01', 503],
    ['too many connections', '53300', 503],
  ])('maps %s (%s) to %i', (_label, state, status) => {
    expect(mapDbError(withState(state))?.status).toBe(status);
  });

  it('maps Node connection errors to 503', () => {
    expect(mapDbError({ code: 'ECONNREFUSED' })?.status).toBe(503);
  });

  it('follows the cause chain', () => {
    expect(
      mapDbError(new Error('wrapped', { cause: withState('23505') }))?.status,
    ).toBe(409);
    expect(sqlState(new Error('wrapped', { cause: withState('22021') }))).toBe(
      '22021',
    );
  });

  it('leaves unknown errors alone so they stay a 500', () => {
    expect(mapDbError(new Error('boom'))).toBeUndefined();
    expect(mapDbError('a string')).toBeUndefined();
    expect(mapDbError(undefined)).toBeUndefined();
    expect(mapDbError(withState('XX000'))).toBeUndefined();
  });

  it('uses generic messages that never leak table, constraint or value details', () => {
    const mapped = mapDbError({
      sqlState: '23505',
      constraint: 'uq_users_email_lower',
      detail: 'Key (email)=(a@b.c) already exists.',
    });
    expect(mapped?.message).toBe('Resource already exists');
  });
});
