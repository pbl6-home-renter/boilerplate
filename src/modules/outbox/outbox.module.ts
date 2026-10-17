import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OUTBOX_DI_TOKEN } from './outbox.di-token';
import { OutboxTypeormEntity } from './infra/persistence/outbox.typeorm-entity';
import { TypeOrmOutboxRepository } from './infra/persistence/outbox.repository';
import { RelayOutboxHandler } from './use-case/relay/relay-outbox.handler';
import { OutboxRelayScheduler } from './infra/scheduler/outbox-relay.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxTypeormEntity])],
  providers: [
    { provide: OUTBOX_DI_TOKEN.REPOSITORY, useClass: TypeOrmOutboxRepository },
    RelayOutboxHandler,
    OutboxRelayScheduler,
  ],
  exports: [OUTBOX_DI_TOKEN.REPOSITORY],
})
export class OutboxModule {}
