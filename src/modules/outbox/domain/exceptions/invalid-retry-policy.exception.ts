import { BaseException } from 'shared/domain/exceptions/base.exception';

export class InvalidRetryPolicyException extends BaseException {
  constructor(reason: string) {
    super(
      `Invalid retry policy: ${reason}`,
      422,
      'INVALID_RETRY_POLICY_EXPCEPTION',
    );
  }
}
