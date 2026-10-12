import { SortOrder } from '../value-objects/sort-order.vo';

export interface IOffsetPaginationQueryRequestDto<
  TFilter = Record<string, unknown>,
> {
  pageNo: number;
  pageSize: number;
  sort?: string;
  order?: SortOrder;
  filter?: TFilter;
}
