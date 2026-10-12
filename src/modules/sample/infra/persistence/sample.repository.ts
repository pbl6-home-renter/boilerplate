import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SampleRepository } from '../../domain/repositories/sample.repository';
import { SampleEntity } from '../../domain/entities/sample.entity';
import { SampleTypeormEntity } from './sample.typeorm-entity';
import { SampleMapper } from '../mappers/sample.mapper';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IOffsetPaginationQueryRequestDto } from '../../../../shared/domain/pagination/i-offset-pagination.query.request.dto';
import { IPaginationResponseDto } from '../../../../shared/domain/pagination/i-pagination.response.dto';
import { TypeOrmPaginator } from '../../../../shared/infra/typeorm/pagination/typeorm.paginator';

@Injectable()
export class TypeOrmSampleRepository implements SampleRepository {
  constructor(
    @InjectRepository(SampleTypeormEntity)
    private readonly repository: Repository<SampleTypeormEntity>,
  ) {}

  async save(sample: SampleEntity): Promise<void> {
    const raw = SampleMapper.toPersistence(sample);
    await this.repository.save(raw);
  }

  async findById(id: Uuid): Promise<SampleEntity | null> {
    const raw = await this.repository.findOne({
      where: { id, isDeleted: false },
    });
    if (!raw) {
      return null;
    }
    return SampleMapper.toDomain(raw);
  }

  async findAll(): Promise<SampleEntity[]> {
    const records = await this.repository.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return records.map((r) => SampleMapper.toDomain(r));
  }

  async findPaginated(
    options: IOffsetPaginationQueryRequestDto,
  ): Promise<IPaginationResponseDto<SampleEntity>> {
    const qb = this.repository
      .createQueryBuilder('sample')
      .where('sample.isDeleted = :isDeleted', { isDeleted: false });

    return TypeOrmPaginator.offset(qb, options)
      .withSort({
        whitelist: ['createdAt', 'title'],
        defaultSort: 'createdAt',
        defaultOrder: 'desc',
        alias: 'sample',
      })
      .paginate((raw) => SampleMapper.toDomain(raw));
  }

  async delete(id: Uuid): Promise<void> {
    await this.repository.update(id, { isDeleted: true });
  }
}
