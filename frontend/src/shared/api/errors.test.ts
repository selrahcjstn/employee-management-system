import { AxiosError, type AxiosResponse } from 'axios';
import { parseApiError } from './errors';

function httpError(status: number, data: unknown): AxiosError {
  const response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: {},
  } as AxiosResponse;
  return new AxiosError(
    'failed',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    response,
  );
}

describe('parseApiError', () => {
  it('uses the short message the API sends for 400, 401, 404 and 409', () => {
    expect(
      parseApiError(httpError(401, { message: 'Invalid email or password' })),
    ).toMatchObject({
      message: 'Invalid email or password',
      status: 401,
    });
    expect(
      parseApiError(
        httpError(409, { message: 'Employee ID already exists', errors: [] }),
      ),
    ).toMatchObject({
      message: 'Employee ID already exists',
      status: 409,
    });
  });

  it('turns 400 validation lines into per-field messages, keeping the first for each field', () => {
    const parsed = parseApiError(
      httpError(400, {
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          'employeeNo must be shorter than or equal to 50 characters',
          'employeeNo should not be empty',
          'body.name must not contain null characters',
          'query.search must be valid Unicode text',
        ],
      }),
    );
    expect(parsed.fieldErrors).toEqual({
      employeeNo: 'must be shorter than or equal to 50 characters',
      name: 'must not contain null characters',
      search: 'must be valid Unicode text',
    });
    expect(parsed.message).toBe('Validation failed');
  });

  it('ignores error lines that do not look like a field message', () => {
    const parsed = parseApiError(
      httpError(400, { message: 'Bad', errors: ['???', 42, null] }),
    );
    expect(parsed.fieldErrors).toEqual({});
  });

  it('does not read field errors from other statuses', () => {
    expect(
      parseApiError(httpError(409, { message: 'x', errors: ['name is taken'] }))
        .fieldErrors,
    ).toEqual({});
  });

  it('explains a rate limit', () => {
    expect(
      parseApiError(
        httpError(429, { message: 'ThrottlerException: Too Many Requests' }),
      ),
    ).toMatchObject({
      message: 'Too many attempts. Please wait a minute and try again.',
      status: 429,
    });
  });

  it('never shows a raw server error: any 5xx is a generic message', () => {
    const parsed = parseApiError(
      httpError(500, {
        message: 'password authentication failed for user "postgres"',
      }),
    );
    expect(parsed.message).toBe(
      'Something went wrong on the server. Please try again.',
    );
    expect(parsed.message).not.toContain('postgres');
  });

  it('reports an unreachable server', () => {
    const parsed = parseApiError(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    );
    expect(parsed).toMatchObject({
      message: 'Cannot reach the server. Check your connection and try again.',
      status: undefined,
    });
  });

  it('falls back to a generic message for anything else', () => {
    expect(parseApiError(new TypeError('boom')).message).toBe(
      'Something went wrong on the server. Please try again.',
    );
    expect(parseApiError(httpError(404, undefined)).message).toBe(
      'Something went wrong on the server. Please try again.',
    );
  });
});
