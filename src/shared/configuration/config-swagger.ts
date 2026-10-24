import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ApiConfigService } from 'shared/services/api-config.service';
import { SERVICE_PATH } from 'shared/constants/service.constants';

export function configureSwagger(
  app: INestApplication,
  configService: ApiConfigService,
) {
  if (configService.enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('NestJS Clean Architecture API')
      .setDescription(
        'Production-grade boilerplate using DDD, CQRS, and Clean Architecture',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${SERVICE_PATH}/swagger`, app, document, {
      useGlobalPrefix: true,
      jsonDocumentUrl: `${SERVICE_PATH}/swagger/json`,
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}
