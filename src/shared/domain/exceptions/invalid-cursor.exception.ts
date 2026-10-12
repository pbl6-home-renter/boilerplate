import { BaseException } from './base.exception';

export class InvalidCursorException extends BaseException {
  constructor(message = 'Invalid or expired cursor') {
    super(message, 422, 'INVALID_CURSOR');
  }
}
