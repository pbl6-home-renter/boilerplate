import type { Request } from 'express';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface AuthenticatedUser {
  id: Uuid;
  role: UserRole;
  status: UserStatus;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
