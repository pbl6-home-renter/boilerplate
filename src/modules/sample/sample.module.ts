import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { SampleTypeormEntity } from './infra/persistence/sample.typeorm-entity';
import { TypeOrmSampleRepository } from './infra/persistence/sample.repository';
import { SAMPLE_DI_TOKEN } from './sample.di-token';
import { SampleController } from './presentation/controllers/sample.controller';
import { CreateSampleCommandHandler } from './use-case/commands/create-sample.command.handler';
import { GetSampleByIdQueryHandler } from './use-case/queries/get-sample-by-id.query.handler';

const commandHandlers = [CreateSampleCommandHandler];
const queryHandlers = [GetSampleByIdQueryHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([SampleTypeormEntity])],
  controllers: [SampleController],
  providers: [
    {
      provide: SAMPLE_DI_TOKEN.REPOSITORY,
      useClass: TypeOrmSampleRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [SAMPLE_DI_TOKEN.REPOSITORY],
})
export class SampleModule {}
