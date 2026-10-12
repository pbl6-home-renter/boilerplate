import { BaseEntity } from '../entities/base.entity';
import { IOffsetPaginationQueryRequestDto } from '../pagination/i-offset-pagination.query.request.dto';
import { Uuid } from '../value-objects/uuid.vo';
import { IPaginationResponseDto } from '../pagination/i-pagination.response.dto';

export interface BaseRepository<T extends BaseEntity> {
  save(entity: T): Promise<void>;

  findAll(): Promise<T[]>;

  findPaginated(
    options: IOffsetPaginationQueryRequestDto,
  ): Promise<IPaginationResponseDto<T>>;

  findById(id: Uuid): Promise<T | null>;

  delete(id: Uuid): Promise<void>;
}
