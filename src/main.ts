import {
  HttpStatus,
  Logger,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { configLogging } from './shared/configuration/config-logging';
import { configureSwagger } from './shared/configuration/config-swagger';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const configService = app.select(SharedModule).get(ApiConfigService);

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.RMQ,
  //   options: {
  //     urls: [configService.rabbitMqUrl],
  //     queue: configService.appName,
  //     queueOptions: {
  //       durable: false,
  //     },
  //   },
  // });

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '10mb' });

  configureSwagger(app, configService);
  configLogging(app, configService);

  await app.startAllMicroservices();
  await app.listen(configService.serverPort);

  const appUrl = await app.getUrl();

  Logger.log(`Application running on: ${appUrl}`);
  Logger.log(`Swagger documentation: ${appUrl}/swagger`);

  return app;
}

void bootstrap();
