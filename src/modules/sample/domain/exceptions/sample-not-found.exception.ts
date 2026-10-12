import { BaseException } from 'shared/domain/exceptions/base.exception';

export class SampleNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Sample with ID "${id}" was not found`, 404, 'NOT_FOUND');
  }
}
