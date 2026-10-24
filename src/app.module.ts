import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingExceptionFilter } from './filter/error-handling-exception-filter';
import { ResponseTransformInterceptor } from './interceptor/response-transform.interceptor';
import { SharedModule } from './shared/shared.module';
import { SecurityModule } from './shared/security.module';
import { SampleModule } from './modules/sample/sample.module';
import { HealthModule } from './modules/health/health.module';
import { OutboxModule } from './modules/outbox/outbox.module';

@Module({
  imports: [
    SharedModule,
    SecurityModule,
    SampleModule,
    OutboxModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: LoggingExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule {}
