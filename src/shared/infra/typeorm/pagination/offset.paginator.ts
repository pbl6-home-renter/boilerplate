import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { applySortingToQueryBuilder, SortOptionConfig } from './sort.helper';
import { IOffsetPaginationQueryRequestDto } from '../../../domain/pagination/i-offset-pagination.query.request.dto';
import { PaginatedResponseDto } from '../../../presentation/pagination/paginated.response.dto';
import { IOffsetPaginationDto } from '../../../domain/pagination/i-offset-pagination.dto';

export class TypeOrmOffsetPaginator<TEntity extends ObjectLiteral> {
  private sortConfig?: SortOptionConfig;

  constructor(
    private readonly queryBuilder: SelectQueryBuilder<TEntity>,
    private readonly options: IOffsetPaginationQueryRequestDto,
  ) {}

  public static of<TEntity extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<TEntity>,
    options: IOffsetPaginationQueryRequestDto,
  ): TypeOrmOffsetPaginator<TEntity> {
    return new TypeOrmOffsetPaginator(queryBuilder, options);
  }

  public withSort(config: SortOptionConfig): this {
    this.sortConfig = config;
    return this;
  }

  public async paginate<TDomain = TEntity>(
    mapper?: (raw: TEntity) => TDomain,
  ): Promise<PaginatedResponseDto<TDomain>> {
    if (this.sortConfig) {
      applySortingToQueryBuilder(
        this.queryBuilder,
        this.options,
        this.sortConfig,
      );
    }

    const pageNo = this.options.pageNo > 0 ? this.options.pageNo : 1;
    const pageSize = this.options.pageSize > 0 ? this.options.pageSize : 20;
    const skip = (pageNo - 1) * pageSize;

    const [records, totalItems] = await this.queryBuilder
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / pageSize);
    const data = mapper
      ? records.map(mapper)
      : (records as unknown as TDomain[]);

    const pagination: IOffsetPaginationDto = {
      type: 'offset',
      pageNo,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: pageNo < totalPages,
      hasPreviousPage: pageNo > 1,
    };

    return {
      data,
      pagination,
    };
  }
}
