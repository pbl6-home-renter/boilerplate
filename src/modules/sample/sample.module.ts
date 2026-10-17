import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { SampleTypeormEntity } from './infra/persistence/sample.typeorm-entity';
import { TypeOrmSampleRepository } from './infra/persistence/sample.repository';
import { SAMPLE_DI_TOKEN } from './sample.di-token';
import { SampleController } from './presentation/controllers/sample.controller';
import { CreateSampleCommandHandler } from './use-case/commands/handlers/sample-create.command.handler';
import { DeleteSampleCommandHandler } from './use-case/commands/handlers/sample-delete.command.handler';
import { GetSampleByIdQueryHandler } from './use-case/queries/handlers/sample-get-by-id.query.handler';
import { SampleSubscriber } from './infra/messaging/sample.subscriber';
import { OutboxModule } from 'modules/outbox/outbox.module';
import { InboxModule } from 'modules/inbox/inbox.module';

const commandHandlers = [
  CreateSampleCommandHandler,
  DeleteSampleCommandHandler,
];
const queryHandlers = [GetSampleByIdQueryHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([SampleTypeormEntity]),
    OutboxModule, // publisher side: CreateSampleCommandHandler appends to the outbox
    InboxModule, // consumer side: SampleSubscriber deduplicates deliveries
  ],
  controllers: [SampleController],
  providers: [
    {
      provide: SAMPLE_DI_TOKEN.REPOSITORY,
      useClass: TypeOrmSampleRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
    SampleSubscriber,
  ],
  exports: [SAMPLE_DI_TOKEN.REPOSITORY],
})
export class SampleModule {}
