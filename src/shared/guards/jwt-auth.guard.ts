import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthErrorCode } from 'shared/constants/auth-error-code.constant';
import {
  INTERNAL_ONLY_METADATA_KEY,
  IS_PUBLIC_METADATA_KEY,
} from 'shared/decorators/auth.decorators';
import { AuthenticatedRequest } from 'shared/interfaces/authenticated-user.interface';
import { AccessTokenVerifier } from 'shared/services/access-token-verifier.service';

/**
 * Global guard: every route requires a valid access token unless marked
 * `@Public()` or `@InternalOnly()`. Identity headers set by the gateway
 * (`x-user-*`) are deliberately ignored.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: AccessTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (
      this.reflector.getAllAndOverride<boolean>(
        INTERNAL_ONLY_METADATA_KEY,
        targets,
      )
    ) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_METADATA_KEY,
      targets,
    );
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException({ code: AuthErrorCode.UNAUTHORIZED });
    }

    try {
      request.user = await this.verifier.verify(token);
    } catch (error) {
      // A bad token on a public route is treated as anonymous.
      if (!isPublic) throw error;
    }
    return true;
  }
}
