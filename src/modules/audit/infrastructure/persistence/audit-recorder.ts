import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { withTransaction } from 'shared/infrastructure/database/transaction/typeorm-transaction-context';
import { AuditEntry } from '../../application/audit-entry';
import { AuditRecorder } from '../../application/ports/audit-recorder.port';
import { AuditLogTypeormEntity } from './audit-log.typeorm-entity';

@Injectable()
export class TypeOrmAuditRecorder implements AuditRecorder {
  constructor(
    @InjectRepository(AuditLogTypeormEntity)
    private readonly repository: Repository<AuditLogTypeormEntity>,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  record(entry: AuditEntry, context?: TransactionContext): Promise<void> {
    return context
      ? this.insert(entry, context)
      : this.unitOfWork.run((transaction) => this.insert(entry, transaction));
  }

  private async insert(
    entry: AuditEntry,
    context: TransactionContext,
  ): Promise<void> {
    await withTransaction(this.repository, context)
      .createQueryBuilder()
      .insert()
      .into(AuditLogTypeormEntity)
      .values({
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId as Uuid | null,
        actorId: entry.actorId as Uuid | null,
        metadata: entry.metadata ?? null,
        occurredAt: entry.occurredAt ?? new Date(),
        sourceEventId: entry.sourceEventId ?? null,
      } as QueryDeepPartialEntity<AuditLogTypeormEntity>)
      .orIgnore()
      .execute();
  }
}
