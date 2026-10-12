import { BaseException } from './base.exception';

export class ValidationException extends BaseException {
  constructor(message = 'Validation failed') {
    super(message, 422, 'VALIDATION_FAILED');
  }
}
