import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  get appName(): string {
    return this.getString('APP_NAME', 'MyApp');
  }

  get rabbitMqUrl(): string {
    return this.getString('RABBITMQ_URL', 'amqp://localhost:5672');
  }

  get apiDomain(): string {
    return this.getString('API_DOMAIN', 'localhost');
  }

  get serverPort(): number {
    return this.getNumber('PORT', 3001);
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV', 'dev');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'dev' || this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'prod' || this.nodeEnv === 'production';
  }

  get enableSwagger(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION', true);
  }

  get logLevel(): string {
    return this.getString('LOG_LEVEL', 'debug');
  }

  get databaseUrl(): string | undefined {
    const value = this.configService.get<string>('DATABASE_URL');

    if (!value || value.trim() === '') {
      return undefined;
    }

    return value.trim();
  }

  get dbSsl(): boolean {
    const explicitSsl = this.configService.get<string>('DB_SSL');

    if (explicitSsl !== undefined && explicitSsl.trim() !== '') {
      return explicitSsl.trim().toLowerCase() === 'true';
    }

    const databaseUrl = this.databaseUrl;

    if (databaseUrl) {
      try {
        const hostname = new URL(databaseUrl).hostname;

        if (
          hostname.endsWith('.supabase.co') ||
          hostname.endsWith('.pooler.supabase.com')
        ) {
          return true;
        }
      } catch {
        // PostgreSQL driver will report malformed URL later.
      }
    }

    const dbHost = this.configService.get<string>('DB_HOST') ?? '';

    if (
      dbHost.endsWith('.supabase.co') ||
      dbHost.endsWith('.pooler.supabase.com')
    ) {
      return true;
    }

    return this.isProduction;
  }

  get dbConfig() {
    const ssl = this.dbSsl ? { rejectUnauthorized: false } : false;
    const databaseUrl = this.databaseUrl;

    if (databaseUrl) {
      return {
        url: databaseUrl,
        logging: this.getBoolean('ENABLE_ORM_LOGS', false),
        ssl,
      };
    }

    return {
      host: this.getString('DB_HOST', 'localhost'),
      port: this.getNumber('DB_PORT', 5432),
      username: this.getString('DB_USERNAME', 'postgres'),
      password: this.getString('DB_PASSWORD', 'postgres'),
      database: this.getString('DB_DATABASE', 'app_db'),
      logging: this.getBoolean('ENABLE_ORM_LOGS', false),
      ssl,
    };
  }

  private getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue?.toString());
    const parsed = Number(value);

    if (isNaN(parsed)) {
      throw new Error(`Environment variable "${key}" is not a valid number`);
    }

    return parsed;
  }

  private getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue?.toString());

    try {
      return Boolean(JSON.parse(value));
    } catch {
      return value === 'true';
    }
  }

  private getString(key: string, defaultValue?: string): string {
    const value = this.get(key, defaultValue);

    return value.replaceAll('\\n', '\n');
  }

  private get(key: string, defaultValue?: string): string {
    const value = this.configService.get<string>(key);

    if (value === undefined || value === null || value === '') {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      throw new Error(`Environment variable "${key}" is required but not set`);
    }

    return value;
  }
}
