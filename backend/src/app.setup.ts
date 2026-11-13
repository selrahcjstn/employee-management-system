import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { env } from './config/env.js';

const messages = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) =>
    Object.values(error.constraints ?? {}).concat(
      messages(error.children ?? []),
    ),
  );

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  // Behind a reverse proxy, trust its X-Forwarded-For so rate limiting sees each client's own IP.
  if (env.trustProxy !== undefined) {
    app.getHttpAdapter().getInstance().set('trust proxy', env.trustProxy);
  }
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: env.frontendOrigin, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Validation failed',
          errors: messages(errors),
        }),
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
