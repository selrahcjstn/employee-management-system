import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string;
  errors: string[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ErrorBody {
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        errors: [],
      };
    }
    const statusCode = exception.getStatus();
    const payload = exception.getResponse();
    if (typeof payload === 'string')
      return { statusCode, message: payload, errors: [] };
    const { message, errors } = payload as {
      message?: string | string[];
      errors?: string[];
    };
    if (Array.isArray(message))
      return { statusCode, message: exception.message, errors: message };
    return {
      statusCode,
      message: message ?? exception.message,
      errors: errors ?? [],
    };
  }
}
