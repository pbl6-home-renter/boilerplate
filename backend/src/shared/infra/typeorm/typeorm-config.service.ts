import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'shared/configuration/snake-naming.strategy';
import { ApiConfigService } from 'shared/services/api-config.service';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ApiConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      dropSchema: false,
      entities: [
        __dirname +
          '/../../../modules/**/infra/persistence/*{.typeorm-entity,.entity}{.ts,.js}',
      ],
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      migrationsRun: false,
      namingStrategy: new SnakeNamingStrategy(),
      ...this.configService.dbConfig,
    } as TypeOrmModuleOptions;
  }
}
