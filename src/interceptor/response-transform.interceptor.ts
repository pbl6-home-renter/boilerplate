import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_CODE_METADATA_KEY } from '../shared/decorators/response-code.decorator';

export interface SuccessResponse<T> {
  statusCode: number;
  code: string;
  data: T;
  pagination?: unknown;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T> | T> {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response?.statusCode ?? HttpStatus.OK;

        // 204 No Content
        if (statusCode === HttpStatus.NO_CONTENT) {
          return data;
        }

        // If response headers already sent (e.g. streaming or custom file download)
        if (response?.headersSent) {
          return data;
        }

        // Check for custom code from @ResponseCode() decorator
        const customCode = this.reflector.getAllAndOverride<string>(
          RESPONSE_CODE_METADATA_KEY,
          [context.getHandler(), context.getClass()],
        );

        // Check if data is already wrapped with standard envelope { statusCode, code, data }
        if (
          data !== null &&
          typeof data === 'object' &&
          'statusCode' in data &&
          'code' in data &&
          'data' in data
        ) {
          return data;
        }

        // Determine code
        let code = customCode;
        if (!code) {
          if (
            data !== null &&
            typeof data === 'object' &&
            'code' in data &&
            typeof data.code === 'string'
          ) {
            code = data.code;
          } else if (statusCode === HttpStatus.CREATED) {
            code = 'CREATED';
          } else {
            code = 'SUCCESS';
          }
        }

        // Handle collection response with pagination
        if (
          data !== null &&
          typeof data === 'object' &&
          'pagination' in data &&
          ('data' in data || 'items' in data)
        ) {
          return {
            statusCode,
            code,
            data: data.data ?? data.items,
            pagination: data.pagination,
          };
        }

        return {
          statusCode,
          code,
          data: data ?? null,
        };
      }),
    );
  }
}
