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

interface ErrorResponsePayload {
  statusCode: number;
  code: string;
}

const HTTP_STATUS_TO_DEFAULT_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_FAILED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
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

    if (exception instanceof BaseException) {
      status = exception.statusCode || HttpStatus.BAD_REQUEST;
      code =
        exception.code || HTTP_STATUS_TO_DEFAULT_CODE[status] || 'BAD_REQUEST';
      const logMessage = `[DomainException] ${exception.name} (${status}) [${code}]: ${exception.message}`;
      this.logger.warn(`${logMessage} - Path: ${request.url}`);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      let logMessage: string;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;

        if (resObj.code && typeof resObj.code === 'string') {
          code = resObj.code;
          logMessage = `[HttpException] ${exception.name} (${status}) [${code}]: ${resObj.message || exception.message}`;
        } else if (
          status === HttpStatus.UNPROCESSABLE_ENTITY ||
          (status === HttpStatus.BAD_REQUEST && Array.isArray(resObj.message))
        ) {
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          code = 'VALIDATION_FAILED';
          logMessage = `[ValidationException] (${status}) [${code}]: ${JSON.stringify(resObj.message)}`;
        } else {
          code = HTTP_STATUS_TO_DEFAULT_CODE[status] || 'BAD_REQUEST';
          logMessage = `[HttpException] ${exception.name} (${status}) [${code}]: ${resObj.message || exception.message}`;
        }
      } else {
        code = HTTP_STATUS_TO_DEFAULT_CODE[status] || 'BAD_REQUEST';
        logMessage = `[HttpException] ${exception.name} (${status}) [${code}]: ${String(exceptionResponse)}`;
      }

      this.logger.warn(`${logMessage} - Path: ${request.url}`);
    } else if (
      (exception as any)?.status === 400 &&
      ((exception as any)?.type === 'entity.parse.failed' ||
        exception instanceof SyntaxError)
    ) {
      status = HttpStatus.BAD_REQUEST;
      code = 'INVALID_JSON';
      this.logger.warn(
        `[InvalidJsonException] (${status}) [${code}]: Syntax error in JSON body - Path: ${request.url}`,
      );
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_SERVER_ERROR';
      this.logger.error(
        `[UnhandledException] ${exception.message} - Path: ${request.url}`,
        exception.stack,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_SERVER_ERROR';
      this.logger.error(
        `[UnknownException] ${String(exception)} - Path: ${request.url}`,
      );
    }

    const errorPayload: ErrorResponsePayload = {
      statusCode: status,
      code,
    };

    response.status(status).json(errorPayload);
  }
}
