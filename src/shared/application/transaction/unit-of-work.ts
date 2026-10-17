import { TransactionContext } from 'shared/domain/transaction/transaction-context';

export interface IUnitOfWork {
  run<T>(work: (context: TransactionContext) => Promise<T>): Promise<T>;
}
