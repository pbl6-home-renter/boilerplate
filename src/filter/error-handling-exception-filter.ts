import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException } from '../shared/domain/exceptions/base.exception';

/**
 * Standard Error Response envelope according to api-conventions.md §1 & §3.
 * Client receives ONLY statusCode and code.
 */
interface ErrorResponsePayload {
  statusCode: number;
  code: string;
}

const HTTP_STATUS_TO_DEFAULT_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'INVALID_TOKEN',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_FAILED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(LoggingExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let code: string;

    // 1. Domain Exceptions (Clean Architecture BaseException)
    if (exception instanceof BaseException) {
      status = exception.statusCode || HttpStatus.BAD_REQUEST;
      code =
        exception.code || HTTP_STATUS_TO_DEFAULT_CODE[status] || 'BAD_REQUEST';
      const logMessage = `[DomainException] ${exception.name} (${status}) [${code}]: ${exception.message}`;
      this.logger.warn(`${logMessage} - Path: ${request.url}`);
    }
    // 2. NestJS HttpExceptions (ValidationPipe, NotFoundException, etc.)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      let logMessage: string;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;

        // Handle ValidationPipe errors -> map to 422 VALIDATION_FAILED
        if (
          status === HttpStatus.UNPROCESSABLE_ENTITY ||
          (status === HttpStatus.BAD_REQUEST && Array.isArray(resObj.message))
        ) {
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          code = 'VALIDATION_FAILED';
          logMessage = `[ValidationException] (${status}) [${code}]: ${JSON.stringify(resObj.message)}`;
        } else if (resObj.code && typeof resObj.code === 'string') {
          code = resObj.code;
          logMessage = `[HttpException] ${exception.name} (${status}) [${code}]: ${resObj.message || exception.message}`;
        } else {
          code = HTTP_STATUS_TO_DEFAULT_CODE[status] || 'BAD_REQUEST';
          logMessage = `[HttpException] ${exception.name} (${status}) [${code}]: ${resObj.message || exception.message}`;
        }
      } else {
        code = HTTP_STATUS_TO_DEFAULT_CODE[status] || 'BAD_REQUEST';
        logMessage = `[HttpException] ${exception.name} (${status}) [${code}]: ${String(exceptionResponse)}`;
      }

      this.logger.warn(`${logMessage} - Path: ${request.url}`);
    }
    // 3. Unhandled Standard Errors & Unknown Exceptions
    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      this.logger.error(
        `[UnhandledException] ${exception.message} - Path: ${request.url}`,
        exception.stack,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      this.logger.error(
        `[UnknownException] ${String(exception)} - Path: ${request.url}`,
      );
    }

    // Client response strictly contains only statusCode and code per spec
    const errorPayload: ErrorResponsePayload = {
      statusCode: status,
      code,
    };

    response.status(status).json(errorPayload);
  }
}
