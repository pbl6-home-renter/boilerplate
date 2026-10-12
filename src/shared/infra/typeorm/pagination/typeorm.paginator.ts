import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { TypeOrmOffsetPaginator } from './offset.paginator';
import { IOffsetPaginationQueryRequestDto } from '../../../domain/pagination/i-offset-pagination.query.request.dto';

export class TypeOrmPaginator {
  public static offset<TEntity extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<TEntity>,
    options: IOffsetPaginationQueryRequestDto,
  ): TypeOrmOffsetPaginator<TEntity> {
    return TypeOrmOffsetPaginator.of(queryBuilder, options);
  }
}
