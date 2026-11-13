import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { env } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  // Close the database pool and finish in-flight requests on SIGTERM / SIGINT.
  app.enableShutdownHooks();
  if (env.swaggerEnabled) {
    const swagger = new DocumentBuilder()
      .setTitle('Salary Management API')
      .addBearerAuth()
      .build();
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, swagger),
    );
  }
  await app.listen(env.port);
}
await bootstrap();
