import type { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from '../../configuration/snake-naming.strategy';

type PostgresOptions = Extract<DataSourceOptions, { type: 'postgres' }>;

export const typeOrmBaseOptions: Pick<
  PostgresOptions,
  'type' | 'dropSchema' | 'namingStrategy' | 'entities' | 'migrations'
> = {
  type: 'postgres',
  dropSchema: false,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    __dirname +
      '/../../../modules/**/infra/persistence/*{.typeorm-entity,.entity}{.ts,.js}',
  ],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
};
