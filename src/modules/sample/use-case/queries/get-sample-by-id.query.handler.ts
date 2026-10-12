import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetSampleByIdQuery } from './get-sample-by-id.query';
import { SAMPLE_DI_TOKEN } from '../../sample.di-token';
import { SampleRepository } from '../../domain/repositories/sample.repository';
import { SampleEntity } from '../../domain/entities/sample.entity';
import { SampleNotFoundException } from '../../domain/exceptions/sample-not-found.exception';

@QueryHandler(GetSampleByIdQuery)
export class GetSampleByIdQueryHandler implements IQueryHandler<
  GetSampleByIdQuery,
  SampleEntity
> {
  constructor(
    @Inject(SAMPLE_DI_TOKEN.REPOSITORY)
    private readonly sampleRepository: SampleRepository,
  ) {}

  async execute(query: GetSampleByIdQuery): Promise<SampleEntity> {
    const sample = await this.sampleRepository.findById(query.id);
    if (!sample) {
      throw new SampleNotFoundException(query.id);
    }
    return sample;
  }
}
