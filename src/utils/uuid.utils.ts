import { randomUUID } from 'node:crypto';
import type { Uuid } from '../shared/domain/value-objects/uuid.vo';

export function generateUuid(): Uuid {
  return randomUUID() as Uuid;
}
