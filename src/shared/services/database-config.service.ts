import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getConfigBoolean,
  getConfigNumber,
  getConfigString,
} from '../configuration/config-value';

@Injectable()
export class DatabaseConfigService {
  constructor(private readonly configService: ConfigService) {}

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

    const nodeEnv = getConfigString(this.configService, 'NODE_ENV', 'dev');
    return nodeEnv === 'prod' || nodeEnv === 'production';
  }

  get dbConfig() {
    const ssl = this.dbSsl ? { rejectUnauthorized: false } : false;
    const databaseUrl = this.databaseUrl;

    if (databaseUrl) {
      return {
        url: databaseUrl,
        logging: getConfigBoolean(this.configService, 'ENABLE_ORM_LOGS', false),
        ssl,
      };
    }

    return {
      host: getConfigString(this.configService, 'DB_HOST', 'localhost'),
      port: getConfigNumber(this.configService, 'DB_PORT', 5432),
      username: getConfigString(this.configService, 'DB_USERNAME', 'postgres'),
      password: getConfigString(this.configService, 'DB_PASSWORD', 'postgres'),
      database: getConfigString(this.configService, 'DB_DATABASE', 'app_db'),
      logging: getConfigBoolean(this.configService, 'ENABLE_ORM_LOGS', false),
      ssl,
    };
  }
}
