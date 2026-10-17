import { BaseException } from 'shared/domain/exceptions/base.exception';
import { OutboxStatus } from '../enums/outbox-status.enum';

export class InvalidOutboxStatusTransitionException extends BaseException {
  constructor(id: string, from: OutboxStatus, to: OutboxStatus) {
    super(
      `Outbox message "${id}" cannot move from ${from} to ${to}`,
      409,
      'OUTBOX_MESSAGE_INVALID_STATUS_TRANSITION',
    );
  }
}
