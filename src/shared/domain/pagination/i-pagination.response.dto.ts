import { IOffsetPaginationDto } from './i-offset-pagination.dto';

export interface IPaginationResponseDto<T> {
  data: T[];
  pagination: IOffsetPaginationDto;
}
