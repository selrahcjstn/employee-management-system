import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

function run(exception: unknown, headersSent = false) {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status, json, headersSent }),
    }),
  } as unknown as ArgumentsHost;
  new HttpExceptionFilter().catch(exception, host);
  return { status, json };
}

describe('HttpExceptionFilter', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('keeps the status and message of an HttpException', () => {
    const { status, json } = run(new NotFoundException('Employee not found'));
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Employee not found',
      errors: [],
    });
  });

  it('keeps a custom message, and the errors list of a validation failure', () => {
    run(new ConflictException('Employee ID already exists'));
    const { json } = run(
      new BadRequestException({
        message: 'Validation failed',
        errors: ['name should not be empty'],
      }),
    );
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Validation failed',
      errors: ['name should not be empty'],
    });
  });

  it('moves a class-validator message array into errors', () => {
    const { json } = run(new BadRequestException(['a is bad', 'b is bad']));
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Bad Request Exception',
      errors: ['a is bad', 'b is bad'],
    });
  });

  it.each([
    ['unique violation', { sqlState: '23505' }, 409, 'Resource already exists'],
    ['NUL byte', { sqlState: '22021' }, 400, 'Invalid value in request'],
    ['check violation', { sqlState: '23514' }, 400, 'Invalid value in request'],
    [
      'connection loss',
      { code: 'ECONNREFUSED' },
      503,
      'Service temporarily unavailable',
    ],
  ])(
    'maps a %s database error instead of returning 500',
    (_label, error, statusCode, message) => {
      const { status, json } = run(error);
      expect(status).toHaveBeenCalledWith(statusCode);
      expect(json).toHaveBeenCalledWith({ statusCode, message, errors: [] });
    },
  );

  it('turns an unexpected error into a generic 500 with no stack or message leaked', () => {
    const { status, json } = run(
      new Error('secret internal detail: password=hunter2'),
    );
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      errors: [],
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain('hunter2');
  });

  it('handles a thrown non-Error value', () => {
    const { status, json } = run('just a string');
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal server error' }),
    );
  });

  it('does nothing when the response was already sent', () => {
    const { status } = run(new Error('late'), true);
    expect(status).not.toHaveBeenCalled();
  });
});
