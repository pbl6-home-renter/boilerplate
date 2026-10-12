import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { ApiConfigService } from 'shared/services/api-config.service';

export function configLogging(
  app: INestApplication,
  configService: ApiConfigService,
) {
  app.useLogger(new Logger(configService.logLevel));
}
