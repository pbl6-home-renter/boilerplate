import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateSampleCommand } from './create-sample.command';
import { SAMPLE_DI_TOKEN } from '../../sample.di-token';
import { SampleRepository } from '../../domain/repositories/sample.repository';
import { SampleEntity } from '../../domain/entities/sample.entity';

@CommandHandler(CreateSampleCommand)
export class CreateSampleCommandHandler implements ICommandHandler<
  CreateSampleCommand,
  SampleEntity
> {
  constructor(
    @Inject(SAMPLE_DI_TOKEN.REPOSITORY)
    private readonly sampleRepository: SampleRepository,
  ) {}

  async execute(command: CreateSampleCommand): Promise<SampleEntity> {
    const sample = SampleEntity.create({
      title: command.title,
      description: command.description,
    });

    await this.sampleRepository.save(sample);
    return sample;
  }
}
