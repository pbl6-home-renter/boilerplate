import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AUDIT_RECORDER_DI_TOKEN } from './audit.di-token';
import { AuditExplorer } from './infrastructure/audit.explorer';
import { AuditLogTypeormEntity } from './infrastructure/persistence/audit-log.typeorm-entity';
import { TypeOrmAuditRecorder } from './infrastructure/persistence/audit-recorder';

@Global()
@Module({
  imports: [DiscoveryModule, TypeOrmModule.forFeature([AuditLogTypeormEntity])],
  providers: [
    AuditExplorer,
    { provide: AUDIT_RECORDER_DI_TOKEN, useClass: TypeOrmAuditRecorder },
  ],
  exports: [AUDIT_RECORDER_DI_TOKEN],
})
export class AuditModule {}
