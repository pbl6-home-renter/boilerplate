import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiConfigService } from './services/api-config.service';
import { TypeormModule } from './infra/typeorm/typeorm.module';
import { RabbitmqModule } from './infra/rabbitmq/rabbitmq.module';
import { MESSAGE_BROKER_DI_TOKEN } from './di-tokens/message-broker.di-token';
import { RabbitmqRepository } from './infra/rabbitmq/rabbitmq.repository';
import { DatabaseConfigService } from './services/database-config.service';

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
    DatabaseConfigService,
    {
      provide: MESSAGE_BROKER_DI_TOKEN.CONSUMER,
      useClass: RabbitmqRepository,
    },
  ],
  exports: [
    ApiConfigService,
    DatabaseConfigService,
    TypeormModule,
    RabbitmqModule,
    MESSAGE_BROKER_DI_TOKEN.CONSUMER,
  ],
})
export class SharedModule {}
