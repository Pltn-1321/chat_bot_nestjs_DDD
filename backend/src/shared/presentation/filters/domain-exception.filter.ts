import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  EntityNotFoundException,
  BusinessRuleViolationException,
  ValidationException,
} from '../../domain';

/**
 * DomainExceptionFilter - Traduit les exceptions Domain en réponses HTTP
 *
 * Architecture Hexagonale:
 * - Les services Application lèvent des exceptions DOMAIN (pures)
 * - Ce filtre dans la couche PRESENTATION les traduit en HTTP
 *
 * Mapping:
 * - EntityNotFoundException      → 404 Not Found
 * - BusinessRuleViolationException → 409 Conflict
 * - ValidationException          → 400 Bad Request
 * - DomainException (autres)     → 500 Internal Server Error
 *
 * Cela permet de garder la couche Application indépendante du framework HTTP.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const { status, error } = this.mapExceptionToHttpResponse(exception);

    const errorResponse = {
      statusCode: status,
      error,
      message: exception.message,
      code: exception.code,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log pour debug (niveau différent selon le type d'erreur)
    if (status >= 500) {
      this.logger.error(
        `[${exception.code}] ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(`[${exception.code}] ${exception.message}`);
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Mappe une exception Domain vers un status HTTP et un message d'erreur
   */
  private mapExceptionToHttpResponse(exception: DomainException): {
    status: HttpStatus;
    error: string;
  } {
    // EntityNotFoundException → 404
    if (exception instanceof EntityNotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      };
    }

    // BusinessRuleViolationException → 409
    if (exception instanceof BusinessRuleViolationException) {
      return {
        status: HttpStatus.CONFLICT,
        error: 'Conflict',
      };
    }

    // ValidationException → 400
    if (exception instanceof ValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
      };
    }

    // Autres DomainException → 500
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
    };
  }
}
