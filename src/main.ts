import type { IncomingMessage } from 'node:http';
import { Logger, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { requestBodyErrorMiddleware } from './middleware/request-body-error.middleware';
import { createRequestBodyNormalizeMiddleware } from './middleware/request-body-normalize.middleware';
import { AppValidationPipe } from './pipe/app-validation.pipe';
import { configLogging } from './shared/configuration/config-logging';
import { configureSwagger } from './shared/configuration/config-swagger';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';
import { createRequestBodyVerifier } from './utils/request-body-verify.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.enableShutdownHooks();

  const configService = app.select(SharedModule).get(ApiConfigService);

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.enableCors();

  app.useGlobalPipes(new AppValidationPipe());

  const emptyBodyRequests = new WeakSet<IncomingMessage>();
  const verifyRequestBody = createRequestBodyVerifier(emptyBodyRequests);

  app.use(json({ limit: '10mb', strict: false, verify: verifyRequestBody }));
  app.use(
    urlencoded({ extended: true, limit: '10mb', verify: verifyRequestBody }),
  );

  app.use(requestBodyErrorMiddleware);
  app.use(createRequestBodyNormalizeMiddleware(emptyBodyRequests));

  configureSwagger(app, configService);
  configLogging(app, configService);

  await app.listen(configService.serverPort);

  const appUrl = await app.getUrl();

  Logger.log(`Application running on: ${appUrl}`);
  Logger.log(`Swagger documentation: ${appUrl}/swagger`);

  return app;
}

void bootstrap();
