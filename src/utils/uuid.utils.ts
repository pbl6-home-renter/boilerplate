import { randomUUID } from 'node:crypto';
import type { Uuid } from '../shared/domain/value-objects/uuid.vo';

export function isValidUuid(uuid?: string | null): boolean {
  if (!uuid) {
    return false;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid,
  );
}

export function generateUuid(): Uuid {
  return randomUUID() as Uuid;
}
