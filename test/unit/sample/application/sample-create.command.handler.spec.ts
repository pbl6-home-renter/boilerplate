import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { SampleRepository } from 'modules/sample/domain/repositories/sample.repository';
import { SampleCreateCommand } from 'modules/sample/application/commands/sample-create/sample-create.command';
import { SampleCreateCommandHandler } from 'modules/sample/application/commands/sample-create/sample-create.command.handler';

describe('SampleCreateCommandHandler', () => {
  it('saves the aggregate and appends its domain events in the same transaction', async () => {
    const context: TransactionContext = { kind: 'transaction' };
    const sampleRepository: SampleRepository = {
      save: jest.fn(async () => undefined),
      findById: jest.fn(async () => null),
      delete: jest.fn(async () => undefined),
      findByIdForUpdate: jest.fn(async () => null),
    };
    const outboxRepository: OutboxRepository = {
      append: jest.fn(async () => undefined),
      claimBatch: jest.fn(async () => []),
      saveClaimOutcome: jest.fn(async () => true),
      reclaimStale: jest.fn(async () => 0),
      requeueFailed: jest.fn(async () => true),
      purgePublished: jest.fn(async () => 0),
    };
    const unitOfWork: IUnitOfWork = {
      run<T>(
        work: (transaction: TransactionContext) => Promise<T>,
      ): Promise<T> {
        return work(context);
      },
    };
    const handler = new SampleCreateCommandHandler(
      sampleRepository,
      unitOfWork,
      outboxRepository,
    );

    const result = await handler.execute(
      new SampleCreateCommand('A sample', 'For unit tests'),
    );

    expect(sampleRepository.save).toHaveBeenCalledWith(result, context);
    expect(outboxRepository.append).toHaveBeenCalledWith(
      [expect.objectContaining({ eventType: 'sample.created' })],
      context,
    );
    expect(result.title).toBe('A sample');
  });
});
