import { BaseEntity } from '../entities/base.entity';
import { IOffsetPaginationQueryRequestDto } from '../pagination/i-offset-pagination.query.request.dto';
import { Uuid } from '../value-objects/uuid.vo';
import { IPaginationResponseDto } from '../pagination/i-pagination.response.dto';
import { TransactionContext } from '../transaction/transaction-context';

export interface BaseRepository<T extends BaseEntity> {
  save(entity: T, context?: TransactionContext): Promise<void>;

  findPaginated(
    options: IOffsetPaginationQueryRequestDto,
  ): Promise<IPaginationResponseDto<T>>;

  findById(id: Uuid): Promise<T | null>;

  delete(id: Uuid, context?: TransactionContext): Promise<void>;
}
