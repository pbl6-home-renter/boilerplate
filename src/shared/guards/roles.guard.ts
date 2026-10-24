import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthErrorCode } from 'shared/constants/auth-error-code.constant';
import { ROLES_METADATA_KEY } from 'shared/decorators/auth.decorators';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { AuthenticatedRequest } from 'shared/interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles || roles.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException({ code: AuthErrorCode.FORBIDDEN });
    }

    return true;
  }
}
