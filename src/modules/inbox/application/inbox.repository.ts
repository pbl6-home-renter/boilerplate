import { TransactionContext } from 'shared/domain/transaction/transaction-context';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';

export interface InboxRepository {
  recordIfNew(
    messageId: Uuid,
    eventType: string,
    context: TransactionContext,
  ): Promise<boolean>;
}
