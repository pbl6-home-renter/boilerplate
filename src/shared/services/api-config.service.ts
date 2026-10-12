import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getConfigBoolean,
  getConfigNumber,
  getConfigString,
} from '../configuration/config-value';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  get appName(): string {
    return getConfigString(this.configService, 'APP_NAME', 'MyApp');
  }

  get rabbitMqUrl(): string {
    return getConfigString(
      this.configService,
      'RABBITMQ_URL',
      'amqp://localhost:5672',
    );
  }

  get apiDomain(): string {
    return getConfigString(this.configService, 'API_DOMAIN', 'localhost');
  }

  get serverPort(): number {
    return getConfigNumber(this.configService, 'PORT', 3001);
  }

  get nodeEnv(): string {
    return getConfigString(this.configService, 'NODE_ENV', 'dev');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'dev' || this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'prod' || this.nodeEnv === 'production';
  }

  get enableSwagger(): boolean {
    return getConfigBoolean(this.configService, 'ENABLE_DOCUMENTATION', true);
  }

  get logLevel(): string {
    return getConfigString(this.configService, 'LOG_LEVEL', 'debug');
  }
}
