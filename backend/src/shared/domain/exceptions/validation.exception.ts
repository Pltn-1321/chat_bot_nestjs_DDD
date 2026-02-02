import { DomainException } from './domain.exception';

/**
 * ValidationException - Levée quand une validation de données échoue
 *
 * Sera traduite en HTTP 400 (Bad Request) par le DomainExceptionFilter
 *
 * @example
 * throw new ValidationException('Invalid email format', 'INVALID_EMAIL');
 * throw new ValidationException('Duration must be between 15 and 480 minutes', 'INVALID_DURATION');
 */
export class ValidationException extends DomainException {
  public readonly field?: string;

  constructor(message: string, code?: string, field?: string) {
    super(message, code || 'VALIDATION_ERROR');
    this.field = field;
  }
}
