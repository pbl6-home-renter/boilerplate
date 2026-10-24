import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { AuthenticatedRequest } from 'shared/interfaces/authenticated-user.interface';

export const IS_PUBLIC_METADATA_KEY = 'isPublic';
export const ROLES_METADATA_KEY = 'roles';
export const ALLOW_LOCKED_METADATA_KEY = 'allowLocked';
export const INTERNAL_ONLY_METADATA_KEY = 'internalOnly';

/** Skips access-token verification. A valid token, if sent, is still attached to `request.user`. */
export const Public = () => SetMetadata(IS_PUBLIC_METADATA_KEY, true);

/** Restricts the handler to the given roles. */
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_METADATA_KEY, roles);

/**
 * Lets a locked account call the handler. Without arguments every role is
 * allowed; with roles only those may (e.g. `@AllowLocked(UserRole.TENANT)`:
 * a locked tenant can still pay invoices, a locked landlord cannot manage).
 */
export const AllowLocked = (...roles: UserRole[]) =>
  SetMetadata(ALLOW_LOCKED_METADATA_KEY, roles);

/**
 * Service-to-service endpoint: authenticated by `X-Service-Token` instead of
 * a user access token. Mount these controllers under `internal/`, which is
 * outside the `api/v1` prefix and never routed by the API Gateway.
 */
export const InternalOnly = () => SetMetadata(INTERNAL_ONLY_METADATA_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
