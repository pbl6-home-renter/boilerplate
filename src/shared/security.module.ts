import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenVerifier } from './services/access-token-verifier.service';
import { ServiceTokenGuard } from './guards/service-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ActiveUserGuard } from './guards/active-user.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Registers the global guards, in order:
 * service token (internal routes) -> access token -> roles -> locked account.
 * Every guard must pass; the order only decides which error wins, so a role
 * that may never call the route gets FORBIDDEN before ACCOUNT_LOCKED.
 */
@Module({
  providers: [
    AccessTokenVerifier,
    { provide: APP_GUARD, useClass: ServiceTokenGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ActiveUserGuard },
  ],
  exports: [AccessTokenVerifier],
})
export class SecurityModule {}
