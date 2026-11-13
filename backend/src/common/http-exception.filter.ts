import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { mapDbError, sqlState } from './db-errors.js';

interface ErrorBody {
  statusCode: number;
  message: string;
  errors: string[];
}

/**
 * The single place every error leaves the API: always `{ statusCode, message, errors[] }`.
 * HttpExceptions keep their status; known database errors become 4xx/503; everything else is a
 * generic 500 whose details only go to the server log, never to the client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    if (response.headersSent) return;
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) return this.fromHttp(exception);

    const mapped = mapDbError(exception);
    if (mapped) {
      this.logger.warn(
        `Database error ${sqlState(exception)} mapped to ${mapped.status}`,
      );
      return { statusCode: mapped.status, message: mapped.message, errors: [] };
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      errors: [],
    };
  }

  private fromHttp(exception: HttpException): ErrorBody {
    const statusCode = exception.getStatus();
    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return { statusCode, message: payload, errors: [] };
    }
    const { message, errors } = payload as {
      message?: string | string[];
      errors?: string[];
    };
    if (Array.isArray(message)) {
      return { statusCode, message: exception.message, errors: message };
    }
    return {
      statusCode,
      message: message ?? exception.message,
      errors: errors ?? [],
    };
  }
}
