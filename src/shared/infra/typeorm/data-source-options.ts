import type { DataSourceOptions } from 'typeorm';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveDatabaseConfig } from '../../configuration/database.config';
import { typeOrmBaseOptions } from './typeorm-base-options';

const envFilePath = resolve(process.cwd(), '.env');

if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

export function createDataSourceOptions(): DataSourceOptions {
  return {
    ...typeOrmBaseOptions,
    ...resolveDatabaseConfig((key) => process.env[key], {
      preferMigrationUrl: true,
    }),
  };
}
