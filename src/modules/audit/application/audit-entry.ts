export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string | null;
  actorId: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
  sourceEventId?: string;
}
