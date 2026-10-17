import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiConfigService } from './services/api-config.service';
import { TypeormModule } from './infra/typeorm/typeorm.module';
import { RabbitmqModule } from './infra/rabbitmq/rabbitmq.module';
import { TypeOrmUnitOfWork } from './infra/typeorm/transaction/typeorm-unit-of-work';
import { UNIT_OF_WORK_DI_TOKEN } from './di-tokens/unit-of-work.di-token';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeormModule,
    RabbitmqModule,
  ],
  providers: [
    ApiConfigService,
    { provide: UNIT_OF_WORK_DI_TOKEN, useClass: TypeOrmUnitOfWork },
  ],
  exports: [
    ApiConfigService,
    TypeormModule,
    RabbitmqModule,
    UNIT_OF_WORK_DI_TOKEN,
  ],
})
export class SharedModule {}
